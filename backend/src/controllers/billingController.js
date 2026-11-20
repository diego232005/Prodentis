import { query, withTransaction } from '../config/database.js'
import { mappers } from '../utils/mappers.js'
import { createId } from '../utils/id.js'
import { assertFound, httpError, wrap } from '../utils/http.js'
import { appTimezone, dateOrToday, localDayStart, parseDateParam } from '../utils/time.js'

const DEFAULT_TAX_RATE = 0.21
const round2 = (n) => Math.round(n * 100) / 100

async function loadInvoice(client, id, lock = false) {
  const inv = assertFound(
    (await client.query(`SELECT * FROM invoices WHERE id = $1${lock ? ' FOR UPDATE' : ''}`, [id])).rows[0],
    'Factura',
  )
  const lines = await client.query('SELECT * FROM invoice_lines WHERE invoice_id = $1 ORDER BY id', [id])
  return { row: inv, lines: lines.rows.map(mappers.invoiceLine) }
}

export const listInvoices = wrap(async (req, res) => {
  const { patientId, status } = req.query
  const { rows } = await query(
    `SELECT * FROM invoices WHERE ($1::varchar IS NULL OR patient_id = $1::varchar)
       AND ($2::varchar IS NULL OR status = $2::varchar) ORDER BY issued_at DESC`,
    [patientId ?? null, status ?? null],
  )
  const ids = rows.map((r) => r.id)
  const lines = ids.length ? (await query('SELECT * FROM invoice_lines WHERE invoice_id = ANY($1::text[])', [ids])).rows : []
  const byInvoice = {}
  for (const l of lines) (byInvoice[l.invoice_id] ??= []).push(mappers.invoiceLine(l))
  res.json(rows.map((r) => mappers.invoice(r, byInvoice[r.id] ?? [])))
})

export const getInvoice = wrap(async (req, res) => {
  const { row, lines } = await loadInvoice({ query }, req.params.id)
  const payments = await query('SELECT * FROM payments WHERE invoice_id = $1 ORDER BY paid_at', [row.id])
  res.json({ ...mappers.invoice(row, lines), payments: payments.rows.map(mappers.payment) })
})

export const createInvoice = wrap(async (req, res) => {
  const b = req.body
  const taxRate = b.taxRate ?? DEFAULT_TAX_RATE
  const subtotal = round2(b.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0))
  const tax = round2(subtotal * taxRate)
  const id = createId('inv')
  const created = await withTransaction(async (client) => {
    const issuedAt = b.issuedAt ?? new Date().toISOString()
    const dueAt = b.dueAt ?? new Date(new Date(issuedAt).getTime() + 15 * 86400000).toISOString()
    const { rows } = await client.query(
      `INSERT INTO invoices (id, patient_id, status, issued_at, due_at, subtotal, tax, total, amount_paid, notes, created_at, updated_at)
       VALUES ($1,$2,'pending',$3,$4,$5,$6,$7,0,$8,NOW(),NOW()) RETURNING *`,
      [id, b.patientId, issuedAt, dueAt, subtotal, tax, round2(subtotal + tax), b.notes ?? ''],
    )
    for (const l of b.lines) {
      await client.query(
        'INSERT INTO invoice_lines (id, invoice_id, description, quantity, unit_price, treatment_id) VALUES ($1,$2,$3,$4,$5,$6)',
        [createId('l'), id, l.description, l.quantity, l.unitPrice, l.treatmentId ?? null],
      )
    }
    return rows[0]
  })
  const { lines } = await loadInvoice({ query }, created.id)
  res.status(201).json(mappers.invoice(created, lines))
})

export const voidInvoice = wrap(async (req, res) => {
  const updated = await withTransaction(async (client) => {
    const { row } = await loadInvoice(client, req.params.id, true)
    if (row.status === 'void') throw httpError(409, 'La factura ya está anulada')
    if (Number(row.amount_paid) > 0) throw httpError(409, 'No se puede anular una factura con pagos registrados')
    const { rows } = await client.query(
      `UPDATE invoices SET status = 'void', notes = CASE WHEN $2 = '' THEN notes ELSE $2 END, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [row.id, req.body?.reason ?? ''],
    )
    return rows[0]
  })
  const { lines } = await loadInvoice({ query }, updated.id)
  res.json(mappers.invoice(updated, lines))
})

export const listPayments = wrap(async (req, res) => {
  const tz = appTimezone()
  const from = parseDateParam(req.query.from)
  const to = parseDateParam(req.query.to)
  const { rows } = await query(
    `SELECT * FROM payments
     WHERE ($2::date IS NULL OR paid_at >= ${localDayStart('$1', '$2')})
       AND ($3::date IS NULL OR paid_at < ${localDayStart('$1', '$3')} + INTERVAL '1 day')
       AND ($4::varchar IS NULL OR invoice_id = $4::varchar)
     ORDER BY paid_at DESC`,
    [tz, from, to, req.query.invoiceId ?? null],
  )
  res.json(rows.map(mappers.payment))
})

export const registerPayment = wrap(async (req, res) => {
  const b = req.body
  const result = await withTransaction(async (client) => {
    const { row, lines } = await loadInvoice(client, req.params.id, true)
    if (row.status === 'void') throw httpError(409, 'La factura está anulada')
    if (row.status === 'paid') throw httpError(409, 'La factura ya está pagada')
    const balance = round2(Number(row.total) - Number(row.amount_paid))
    if (b.amount > balance + 0.001) throw httpError(400, `El monto supera el saldo pendiente (${balance})`)
    const paid = await client.query(
      `INSERT INTO payments (id, invoice_id, amount, method, paid_at, reference)
       VALUES ($1,$2,$3,$4,COALESCE($5::timestamptz, NOW()),$6) RETURNING *`,
      [createId('pay'), row.id, b.amount, b.method, b.paidAt ?? null, b.reference ?? ''],
    )
    const newPaid = round2(Number(row.amount_paid) + b.amount)
    const inv = await client.query(
      `UPDATE invoices SET amount_paid = $2, status = CASE WHEN $2 >= total THEN 'paid' ELSE 'partial' END, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [row.id, newPaid],
    )
    return { payment: paid.rows[0], invoice: inv.rows[0], lines }
  })
  res.status(201).json({
    payment: mappers.payment(result.payment),
    invoice: mappers.invoice(result.invoice, result.lines),
  })
})

// ── Cierres de caja ──────────────────────────────────────
async function computeDay(client, tz, date) {
  const { rows } = await client.query(
    `SELECT ${dateOrToday('$1', '$2')}::text AS day,
       COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'cash'), 0) AS cash,
       COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'card'), 0) AS card,
       COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'transfer'), 0) AS transfer,
       COUNT(p.id)::int AS n
     FROM (SELECT 1) x
     LEFT JOIN payments p ON p.paid_at >= ${localDayStart('$1', dateOrToday('$1', '$2'))}
                         AND p.paid_at < ${localDayStart('$1', dateOrToday('$1', '$2'))} + INTERVAL '1 day'`,
    [tz, date],
  )
  const r = rows[0]
  const cash = Number(r.cash)
  const card = Number(r.card)
  const transfer = Number(r.transfer)
  return { date: r.day, cash, card, transfer, total: round2(cash + card + transfer), paymentsCount: r.n }
}

export const cashSummary = wrap(async (req, res) => {
  const tz = appTimezone()
  const day = await computeDay({ query }, tz, parseDateParam(req.query.date))
  const closed = (await query('SELECT * FROM cash_closures WHERE closure_date = $1::date', [day.date])).rows[0]
  res.json({ ...day, timezone: tz, closure: closed ? mappers.cashClosure(closed) : null })
})

export const listCashClosures = wrap(async (_req, res) => {
  const { rows } = await query('SELECT * FROM cash_closures ORDER BY closure_date DESC LIMIT 366')
  res.json(rows.map(mappers.cashClosure))
})

export const createCashClosure = wrap(async (req, res) => {
  const tz = appTimezone()
  const b = req.body
  const created = await withTransaction(async (client) => {
    const day = await computeDay(client, tz, parseDateParam(b.date))
    const exists = await client.query('SELECT 1 FROM cash_closures WHERE closure_date = $1::date', [day.date])
    if (exists.rows[0]) throw httpError(409, `La caja del ${day.date} ya fue cerrada`)
    const { rows } = await client.query(
      `INSERT INTO cash_closures (id, closure_date, expected_cash, expected_card, expected_transfer, counted_cash,
         difference, payments_count, notes, closed_by)
       VALUES ($1,$2::date,$3,$4,$5,$6,$7,$8,$9,(SELECT id FROM users WHERE id = $10::varchar)) RETURNING *`,
      [
        createId('cc'), day.date, day.cash, day.card, day.transfer, b.countedCash, round2(b.countedCash - day.cash),
        day.paymentsCount, b.notes ?? '', req.actor?.id ?? null,
      ],
    )
    return rows[0]
  })
  res.status(201).json(mappers.cashClosure(created))
})
