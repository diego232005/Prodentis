import { query, withTransaction } from '../config/database.js'
import { mappers } from '../utils/mappers.js'
import { createId } from '../utils/id.js'
import { assertFound, httpError, wrap } from '../utils/http.js'

// ── Tratamientos ─────────────────────────────────────────
export const listTreatments = wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM treatments WHERE ($1::varchar IS NULL OR patient_id = $1::varchar)
       AND ($2::varchar IS NULL OR status = $2::varchar) ORDER BY start_date DESC`,
    [req.query.patientId ?? null, req.query.status ?? null],
  )
  res.json(rows.map(mappers.treatment))
})

export const createTreatment = wrap(async (req, res) => {
  const b = req.body
  if (b.sessionsDone > b.sessionsPlanned) throw httpError(400, 'Las sesiones realizadas no pueden superar las planificadas')
  const { rows } = await query(
    `INSERT INTO treatments (id, patient_id, dentist_id, procedure_id, status, start_date, end_date, sessions_planned,
       sessions_done, cost, notes, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,COALESCE($6::timestamptz, NOW()),$7,$8,$9,$10,$11,NOW(),NOW()) RETURNING *`,
    [
      createId('t'), b.patientId, b.dentistId, b.procedureId, b.status ?? 'planned', b.startDate ?? null, b.endDate ?? null,
      b.sessionsPlanned ?? 1, b.sessionsDone ?? 0, b.cost, b.notes ?? '',
    ],
  )
  res.status(201).json(mappers.treatment(rows[0]))
})

export const updateTreatment = wrap(async (req, res) => {
  const cur = assertFound((await query('SELECT * FROM treatments WHERE id = $1', [req.params.id])).rows[0], 'Tratamiento')
  const b = req.body
  const sessionsPlanned = b.sessionsPlanned ?? cur.sessions_planned
  const sessionsDone = b.sessionsDone ?? cur.sessions_done
  if (sessionsDone > sessionsPlanned) throw httpError(400, 'Las sesiones realizadas no pueden superar las planificadas')
  const status = b.status ?? cur.status
  const { rows } = await query(
    `UPDATE treatments SET dentist_id = $2, procedure_id = $3, status = $4::text, start_date = $5, end_date = $6,
       sessions_planned = $7, sessions_done = $8, cost = $9, notes = $10, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      cur.id, b.dentistId ?? cur.dentist_id, b.procedureId ?? cur.procedure_id, status, b.startDate ?? cur.start_date,
      'endDate' in b ? b.endDate : status === 'completed' && !cur.end_date ? new Date().toISOString() : cur.end_date,
      sessionsPlanned, sessionsDone, b.cost ?? cur.cost, b.notes ?? cur.notes,
    ],
  )
  res.json(mappers.treatment(rows[0]))
})

export const deleteTreatment = wrap(async (req, res) => {
  const { rowCount } = await query('DELETE FROM treatments WHERE id = $1', [req.params.id])
  assertFound(rowCount, 'Tratamiento')
  res.status(204).send()
})

// ── Planes de tratamiento ────────────────────────────────
async function planWithItems(client, id) {
  const plan = assertFound((await client.query('SELECT * FROM treatment_plans WHERE id = $1', [id])).rows[0], 'Plan')
  const items = await client.query('SELECT * FROM treatment_plan_items WHERE plan_id = $1 ORDER BY sort_order, id', [id])
  return mappers.treatmentPlan(plan, items.rows.map(mappers.planItem))
}

async function writeItems(client, planId, items) {
  await client.query('DELETE FROM treatment_plan_items WHERE plan_id = $1', [planId])
  for (const [i, it] of items.entries()) {
    let { description, unitPrice } = it
    if (it.procedureId && (!description || unitPrice == null)) {
      const proc = assertFound((await client.query('SELECT * FROM procedures WHERE id = $1', [it.procedureId])).rows[0], 'Procedimiento')
      description = description ?? proc.name
      unitPrice = unitPrice ?? Number(proc.base_price)
    }
    await client.query(
      `INSERT INTO treatment_plan_items (id, plan_id, procedure_id, description, tooth_id, quantity, unit_price, status, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [createId('tpi'), planId, it.procedureId ?? null, description, it.toothId ?? null, it.quantity ?? 1, unitPrice ?? 0, it.status ?? 'pending', i],
    )
  }
}

async function recalcTotal(client, planId) {
  await client.query(
    `UPDATE treatment_plans p SET total = GREATEST(0, COALESCE((
         SELECT SUM(quantity * unit_price) FROM treatment_plan_items WHERE plan_id = p.id AND status <> 'cancelled'), 0) - p.discount),
       updated_at = NOW()
     WHERE id = $1`,
    [planId],
  )
}

export const listPlans = wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM treatment_plans WHERE ($1::varchar IS NULL OR patient_id = $1::varchar) ORDER BY created_at DESC`,
    [req.query.patientId ?? null],
  )
  const ids = rows.map((r) => r.id)
  const items = ids.length
    ? (await query('SELECT * FROM treatment_plan_items WHERE plan_id = ANY($1::text[]) ORDER BY sort_order, id', [ids])).rows
    : []
  const byPlan = {}
  for (const it of items) (byPlan[it.plan_id] ??= []).push(mappers.planItem(it))
  res.json(rows.map((r) => mappers.treatmentPlan(r, byPlan[r.id] ?? [])))
})

export const getPlan = wrap(async (req, res) => {
  res.json(await planWithItems({ query }, req.params.id))
})

export const createPlan = wrap(async (req, res) => {
  const b = req.body
  const plan = await withTransaction(async (client) => {
    const id = createId('tp')
    await client.query(
      `INSERT INTO treatment_plans (id, patient_id, dentist_id, title, status, discount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, b.patientId, b.dentistId, b.title, b.status ?? 'draft', b.discount ?? 0, b.notes ?? ''],
    )
    await writeItems(client, id, b.items ?? [])
    await recalcTotal(client, id)
    return planWithItems(client, id)
  })
  res.status(201).json(plan)
})

export const updatePlan = wrap(async (req, res) => {
  const b = req.body
  const plan = await withTransaction(async (client) => {
    const cur = assertFound((await client.query('SELECT * FROM treatment_plans WHERE id = $1 FOR UPDATE', [req.params.id])).rows[0], 'Plan')
    const status = b.status ?? cur.status
    await client.query(
      `UPDATE treatment_plans SET title = $2, status = $3::text, discount = $4, notes = $5,
         approved_at = CASE WHEN $3::text = 'approved' AND approved_at IS NULL THEN NOW() ELSE approved_at END, updated_at = NOW()
       WHERE id = $1`,
      [cur.id, b.title ?? cur.title, status, b.discount ?? cur.discount, b.notes ?? cur.notes],
    )
    if (b.items) await writeItems(client, cur.id, b.items)
    await recalcTotal(client, cur.id)
    return planWithItems(client, cur.id)
  })
  res.json(plan)
})

export const updatePlanItem = wrap(async (req, res) => {
  const plan = await withTransaction(async (client) => {
    const { rows } = await client.query(
      'UPDATE treatment_plan_items SET status = $2 WHERE id = $1 RETURNING plan_id',
      [req.params.itemId, req.body.status],
    )
    const planId = assertFound(rows[0], 'Ítem del plan').plan_id
    await recalcTotal(client, planId)
    // Completa el plan si no quedan ítems pendientes
    await client.query(
      `UPDATE treatment_plans SET status = 'completed', updated_at = NOW()
       WHERE id = $1 AND status IN ('approved','in_progress')
         AND NOT EXISTS (SELECT 1 FROM treatment_plan_items WHERE plan_id = $1 AND status = 'pending')
         AND EXISTS (SELECT 1 FROM treatment_plan_items WHERE plan_id = $1 AND status = 'done')`,
      [planId],
    )
    await client.query(
      `UPDATE treatment_plans SET status = 'in_progress', updated_at = NOW() WHERE id = $1 AND status = 'approved'
         AND EXISTS (SELECT 1 FROM treatment_plan_items WHERE plan_id = $1 AND status = 'done')
         AND EXISTS (SELECT 1 FROM treatment_plan_items WHERE plan_id = $1 AND status = 'pending')`,
      [planId],
    )
    return planWithItems(client, planId)
  })
  res.json(plan)
})

export const approvePlan = wrap(async (req, res) => {
  const plan = await withTransaction(async (client) => {
    const cur = assertFound((await client.query('SELECT status FROM treatment_plans WHERE id = $1 FOR UPDATE', [req.params.id])).rows[0], 'Plan')
    if (!['draft', 'proposed'].includes(cur.status)) throw httpError(409, `El plan está "${cur.status}"`)
    await client.query("UPDATE treatment_plans SET status = 'approved', approved_at = NOW(), updated_at = NOW() WHERE id = $1", [req.params.id])
    return planWithItems(client, req.params.id)
  })
  res.json(plan)
})

export const deletePlan = wrap(async (req, res) => {
  const { rowCount } = await query('DELETE FROM treatment_plans WHERE id = $1', [req.params.id])
  assertFound(rowCount, 'Plan')
  res.status(204).send()
})
