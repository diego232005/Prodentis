import { query } from '../config/database.js'
import { appTimezone } from '../utils/time.js'

const TODAY_APPOINTMENTS = [
  { id: 'a-today-9', patient: 'p9', dentist: 'd1', chair: 'c1', h: 8, m: 0, dur: 30, status: 'no_show', reason: 'Control', procedure: 'pr1' },
  { id: 'a-today-1', patient: 'p1', dentist: 'd1', chair: 'c1', h: 9, m: 0, dur: 45, status: 'completed', reason: 'Control', procedure: 'pr1' },
  { id: 'a-today-2', patient: 'p2', dentist: 'd1', chair: 'c1', h: 10, m: 30, dur: 45, status: 'completed', reason: 'Limpieza', procedure: 'pr2' },
  { id: 'a-today-3', patient: 'p3', dentist: 'd2', chair: 'c2', h: 11, m: 0, dur: 45, status: 'in_progress', reason: 'Restauración', procedure: 'pr3' },
  { id: 'a-today-8', patient: 'p8', dentist: 'd1', chair: 'c1', h: 11, m: 30, dur: 45, status: 'waiting', reason: 'Dolor molar', procedure: 'pr1' },
  { id: 'a-today-4', patient: 'p4', dentist: 'd2', chair: 'c2', h: 14, m: 0, dur: 60, status: 'confirmed', reason: 'Endodoncia', procedure: 'pr4' },
  { id: 'a-today-5', patient: 'p5', dentist: 'd1', chair: 'c1', h: 15, m: 0, dur: 30, status: 'pending', reason: 'Consulta inicial', procedure: 'pr1' },
  { id: 'a-today-6', patient: 'p6', dentist: 'd1', chair: 'c1', h: 16, m: 0, dur: 45, status: 'confirmed', reason: 'Ortodoncia', procedure: 'pr6' },
  { id: 'a-today-7', patient: 'p7', dentist: 'd2', chair: 'c2', h: 17, m: 0, dur: 45, status: 'cancelled', reason: 'Urgencia dolor', procedure: null },
]

const EXPIRING = [
  ['i1', 7, 'L-DEMO-001'],
  ['i2', 20, 'L-DEMO-002'],
  ['i3', -3, 'L-DEMO-003'],
  ['i4', 28, 'L-DEMO-004'],
]

async function instant(today, dayOffset, hour, minute, tz) {
  const { rows } = await query(
    'SELECT (($1::date + $2::int + make_time($3::int, $4::int, 0)) AT TIME ZONE $5::text) AS ts',
    [today, dayOffset, hour, minute, tz],
  )
  return rows[0].ts
}

async function upsertInvoice(inv) {
  await query(
    `INSERT INTO invoices (id, patient_id, status, issued_at, due_at, subtotal, tax, total, amount_paid, notes, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'',$4,NOW())
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, issued_at = EXCLUDED.issued_at, due_at = EXCLUDED.due_at,
       amount_paid = EXCLUDED.amount_paid, updated_at = NOW()`,
    [inv.id, inv.patient, inv.status, inv.issuedAt, inv.dueAt, inv.subtotal, inv.tax, inv.total, inv.amountPaid],
  )
  await query(
    `INSERT INTO invoice_lines (id, invoice_id, description, quantity, unit_price)
     VALUES ($1,$2,$3,1,$4) ON CONFLICT DO NOTHING`,
    [`l-${inv.id}`, inv.id, inv.description, inv.subtotal],
  )
}

async function upsertPayment(p) {
  await query(
    `INSERT INTO payments (id, invoice_id, amount, method, paid_at, reference)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET paid_at = EXCLUDED.paid_at, amount = EXCLUDED.amount, method = EXCLUDED.method`,
    [p.id, p.invoice, p.amount, p.method, p.paidAt, p.reference],
  )
}

/** Reubica datos de demostración "de hoy" según APP_TIMEZONE. Se ejecuta en cada arranque. */
export async function refreshTodayDemo() {
  const tz = appTimezone()
  const { rows: patientRows } = await query("SELECT id FROM patients WHERE id = ANY($1::text[])", [['p1', 'p9']])
  if (patientRows.length < 2) return
  const { rows: chairRows } = await query('SELECT id FROM dental_chairs')
  const chairs = new Set(chairRows.map((c) => c.id))
  const { rows: today } = await query('SELECT (NOW() AT TIME ZONE $1::text)::date AS today', [tz])
  const day = today[0].today

  for (const a of TODAY_APPOINTMENTS) {
    const start = await instant(day, 0, a.h, a.m, tz)
    const end = new Date(start.getTime() + a.dur * 60000)
    const waiting = a.status === 'waiting'
    const cancelled = a.status === 'cancelled' || a.status === 'no_show'
    await query(
      `INSERT INTO appointments (id, patient_id, dentist_id, chair_id, procedure_id, start_at, end_at, status, reason, notes,
         cancel_reason, cancelled_at, waiting_since, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'',$10, CASE WHEN $11 THEN NOW() END, CASE WHEN $12 THEN NOW() - INTERVAL '12 minutes' END,
         NOW() - INTERVAL '2 days', NOW())
       ON CONFLICT (id) DO UPDATE SET
         patient_id = EXCLUDED.patient_id, dentist_id = EXCLUDED.dentist_id, chair_id = EXCLUDED.chair_id,
         procedure_id = EXCLUDED.procedure_id, start_at = EXCLUDED.start_at, end_at = EXCLUDED.end_at,
         status = EXCLUDED.status, reason = EXCLUDED.reason, cancel_reason = EXCLUDED.cancel_reason,
         cancelled_at = EXCLUDED.cancelled_at, waiting_since = EXCLUDED.waiting_since, updated_at = NOW()`,
      [
        a.id, a.patient, a.dentist, chairs.has(a.chair) ? a.chair : null, a.procedure, start, end, a.status, a.reason,
        a.status === 'cancelled' ? 'Paciente avisó que no podía asistir' : '',
        cancelled, waiting,
      ],
    )
  }

  // Pagos de hoy
  const todayInvoices = [
    { id: 'inv-today-1', patient: 'p1', subtotal: 15000, status: 'paid', paid: 18150, method: 'cash', h: 9, m: 50 },
    { id: 'inv-today-2', patient: 'p2', subtotal: 28000, status: 'paid', paid: 33880, method: 'card', h: 11, m: 20 },
    { id: 'inv-today-3', patient: 'p3', subtotal: 45000, status: 'partial', paid: 25000, method: 'transfer', h: 12, m: 10 },
  ]
  const issuedToday = await instant(day, 0, 8, 0, tz)
  for (const t of todayInvoices) {
    const tax = Math.round(t.subtotal * 0.21)
    await upsertInvoice({
      id: t.id, patient: t.patient, status: t.status, issuedAt: issuedToday, dueAt: await instant(day, 15, 0, 0, tz),
      subtotal: t.subtotal, tax, total: t.subtotal + tax, amountPaid: t.paid, description: 'Atención del día',
    })
    const planned = await instant(day, 0, t.h, t.m, tz)
    await upsertPayment({
      id: `pay-${t.id}`, invoice: t.id, amount: t.paid, method: t.method,
      paidAt: planned > new Date() ? new Date() : planned, reference: `HOY-${t.id.slice(-1)}`,
    })
  }

  // Facturas pendientes / vencidas
  const pending = [
    { id: 'inv-pend-1', patient: 'p4', subtotal: 120000, status: 'pending', paid: 0, issued: -25, due: -5 },
    { id: 'inv-pend-2', patient: 'p5', subtotal: 85000, status: 'pending', paid: 0, issued: -4, due: 10 },
    { id: 'inv-pend-3', patient: 'p6', subtotal: 180000, status: 'partial', paid: 50000, issued: -12, due: 3 },
  ]
  for (const p of pending) {
    const tax = Math.round(p.subtotal * 0.21)
    await upsertInvoice({
      id: p.id, patient: p.patient, status: p.status, issuedAt: await instant(day, p.issued, 10, 0, tz),
      dueAt: await instant(day, p.due, 23, 59, tz), subtotal: p.subtotal, tax, total: p.subtotal + tax,
      amountPaid: p.paid, description: 'Tratamiento pendiente de pago',
    })
    if (p.paid > 0) {
      await upsertPayment({
        id: `pay-${p.id}`, invoice: p.id, amount: p.paid, method: 'cash',
        paidAt: await instant(day, p.issued + 2, 11, 0, tz), reference: 'ANTICIPO',
      })
    }
  }

  // Inventario: lote/vencimiento
  await query(
    `UPDATE inventory_items
     SET expires_at = $1::date + 120 + (abs(hashtext(id)) % 400),
         lot_number = 'L-' || upper(substr(md5(id), 1, 6))
     WHERE expires_at IS NULL`,
    [day],
  )
  for (const [id, offset, lot] of EXPIRING) {
    await query('UPDATE inventory_items SET expires_at = $2::date + $3::int, lot_number = $4 WHERE id = $1', [id, day, offset, lot])
  }
}
