import { query, withTransaction } from '../config/database.js'
import { mappers } from '../utils/mappers.js'
import { createId } from '../utils/id.js'
import { assertFound, httpError, wrap } from '../utils/http.js'
import { appTimezone, dateOrToday, localDayStart, parseDateParam } from '../utils/time.js'

const INACTIVE = ['cancelled', 'no_show']
const isActive = (status) => !INACTIVE.includes(status)

async function findAppointment(client, id, lock = false) {
  const { rows } = await client.query(`SELECT * FROM appointments WHERE id = $1${lock ? ' FOR UPDATE' : ''}`, [id])
  return assertFound(rows[0], 'Cita')
}

/** Valida horario, bloqueos del odontólogo y solapes (odontólogo, sillón, paciente). */
async function assertNoConflicts(client, { id = null, patientId, dentistId, chairId, startAt, endAt }) {
  if (new Date(endAt) <= new Date(startAt)) throw httpError(400, 'La hora de fin debe ser posterior al inicio')

  if (chairId) {
    const chair = await client.query('SELECT active FROM dental_chairs WHERE id = $1', [chairId])
    if (!chair.rows[0]) throw httpError(400, 'Sillón no válido')
    if (!chair.rows[0].active) throw httpError(400, 'El sillón está inactivo')
  }

  const block = await client.query(
    'SELECT reason FROM dentist_blocks WHERE dentist_id = $1 AND start_at < $3::timestamptz AND end_at > $2::timestamptz LIMIT 1',
    [dentistId, startAt, endAt],
  )
  if (block.rows[0]) {
    throw httpError(409, `El odontólogo no está disponible en ese horario${block.rows[0].reason ? ` (${block.rows[0].reason})` : ''}`)
  }

  const { rows } = await client.query(
    `SELECT id, dentist_id, chair_id, patient_id FROM appointments
     WHERE ($1::varchar IS NULL OR id <> $1::varchar)
       AND status NOT IN ('cancelled', 'no_show')
       AND start_at < $3::timestamptz AND end_at > $2::timestamptz
       AND (dentist_id = $4 OR patient_id = $5 OR ($6::varchar IS NOT NULL AND chair_id = $6::varchar))`,
    [id, startAt, endAt, dentistId, patientId, chairId ?? null],
  )
  const hit = rows[0]
  if (!hit) return
  const err = httpError(
    409,
    hit.dentist_id === dentistId
      ? 'El odontólogo ya tiene una cita en ese horario'
      : chairId && hit.chair_id === chairId
        ? 'El sillón ya está ocupado en ese horario'
        : 'El paciente ya tiene una cita en ese horario',
  )
  err.details = { conflictingAppointmentId: hit.id }
  throw err
}

const lockSchedule = (client) => client.query("SELECT pg_advisory_xact_lock(hashtext('appointments_schedule'))")

export const listAppointments = wrap(async (req, res) => {
  const { from, to, dentistId, patientId, status, chairId } = req.query
  const rows = (
    await query(
      `SELECT * FROM appointments
       WHERE ($1::timestamptz IS NULL OR start_at >= $1::timestamptz)
         AND ($2::timestamptz IS NULL OR start_at < $2::timestamptz)
         AND ($3::varchar IS NULL OR dentist_id = $3::varchar)
         AND ($4::varchar IS NULL OR patient_id = $4::varchar)
         AND ($5::varchar IS NULL OR status = $5::varchar)
         AND ($6::varchar IS NULL OR chair_id = $6::varchar)
       ORDER BY start_at ASC`,
      [from ?? null, to ?? null, dentistId ?? null, patientId ?? null, status ?? null, chairId ?? null],
    )
  ).rows
  res.json(rows.map(mappers.appointment))
})

export const getAppointment = wrap(async (req, res) => {
  res.json(mappers.appointment(await findAppointment({ query }, req.params.id)))
})

export const createAppointment = wrap(async (req, res) => {
  const b = req.body
  const status = b.status ?? 'pending'
  if (status === 'cancelled' && !b.cancelReason?.trim()) throw httpError(400, 'Indicá el motivo de cancelación')
  const created = await withTransaction(async (client) => {
    await lockSchedule(client)
    if (isActive(status)) {
      await assertNoConflicts(client, {
        patientId: b.patientId, dentistId: b.dentistId, chairId: b.chairId, startAt: b.startAt, endAt: b.endAt,
      })
    }
    const now = new Date().toISOString()
    const { rows } = await client.query(
      `INSERT INTO appointments (id, patient_id, dentist_id, chair_id, procedure_id, start_at, end_at, status, reason, notes,
         cancel_reason, cancelled_at, waiting_since, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::text,$9,$10,$11, CASE WHEN $8::text IN ('cancelled','no_show') THEN NOW() END,
         CASE WHEN $8::text = 'waiting' THEN NOW() END, $12, $12)
       RETURNING *`,
      [
        createId('a'), b.patientId, b.dentistId, b.chairId ?? null, b.procedureId ?? null, b.startAt, b.endAt, status,
        b.reason ?? '', b.notes ?? '', b.cancelReason ?? '', now,
      ],
    )
    return rows[0]
  })
  res.status(201).json(mappers.appointment(created))
})

export const updateAppointment = wrap(async (req, res) => {
  const b = req.body
  const updated = await withTransaction(async (client) => {
    await lockSchedule(client)
    const r = await findAppointment(client, req.params.id, true)
    const next = {
      patientId: b.patientId ?? r.patient_id,
      dentistId: b.dentistId ?? r.dentist_id,
      chairId: 'chairId' in b ? b.chairId : r.chair_id,
      procedureId: 'procedureId' in b ? b.procedureId : r.procedure_id,
      startAt: b.startAt ?? r.start_at,
      endAt: b.endAt ?? r.end_at,
      status: b.status ?? r.status,
    }
    if (next.status === 'cancelled' && r.status !== 'cancelled' && !(b.cancelReason ?? '').trim()) {
      throw httpError(400, 'Indicá el motivo de cancelación')
    }
    if (isActive(next.status)) await assertNoConflicts(client, { id: r.id, ...next })
    else if (new Date(next.endAt) <= new Date(next.startAt)) throw httpError(400, 'La hora de fin debe ser posterior al inicio')

    const { rows } = await client.query(
      `UPDATE appointments SET
        patient_id = $2, dentist_id = $3, chair_id = $4, procedure_id = $5, start_at = $6, end_at = $7,
        status = $8::text, reason = $9, notes = $10,
        cancel_reason = CASE WHEN $8::text IN ('cancelled','no_show') THEN COALESCE($11, cancel_reason) ELSE '' END,
        cancelled_at = CASE WHEN $8::text IN ('cancelled','no_show') THEN COALESCE(cancelled_at, NOW()) ELSE NULL END,
        waiting_since = CASE WHEN $8::text = 'waiting' THEN COALESCE(waiting_since, NOW()) ELSE waiting_since END,
        updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        r.id, next.patientId, next.dentistId, next.chairId ?? null, next.procedureId ?? null, next.startAt, next.endAt,
        next.status, b.reason ?? r.reason, b.notes ?? r.notes, b.cancelReason ?? null,
      ],
    )
    return rows[0]
  })
  res.json(mappers.appointment(updated))
})

async function transition(id, status, extra = {}) {
  return withTransaction(async (client) => {
    const r = await findAppointment(client, id, true)
    if (['completed', 'cancelled', 'no_show'].includes(r.status) && r.status !== status) {
      throw httpError(409, `La cita ya está en estado "${r.status}"`)
    }
    const { rows } = await client.query(
      `UPDATE appointments SET status = $2::text,
         cancel_reason = COALESCE($3, cancel_reason),
         cancelled_at = CASE WHEN $2::text IN ('cancelled','no_show') THEN NOW() ELSE cancelled_at END,
         waiting_since = CASE WHEN $2::text = 'waiting' THEN COALESCE(waiting_since, NOW()) ELSE waiting_since END,
         updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, status, extra.cancelReason ?? null],
    )
    return rows[0]
  })
}

export const cancelAppointment = wrap(async (req, res) => {
  const reason = req.body.reason.trim()
  res.json(mappers.appointment(await transition(req.params.id, 'cancelled', { cancelReason: reason })))
})

export const checkInAppointment = wrap(async (req, res) => {
  res.json(mappers.appointment(await transition(req.params.id, 'waiting')))
})

export const markNoShow = wrap(async (req, res) => {
  res.json(mappers.appointment(await transition(req.params.id, 'no_show', { cancelReason: req.body?.reason ?? 'No asistió' })))
})

export const receptionBoard = wrap(async (req, res) => {
  const tz = appTimezone()
  const date = parseDateParam(req.query.date)
  const { rows } = await query(
    `SELECT a.*, p.first_name || ' ' || p.last_name AS patient_name, p.phone AS patient_phone,
            d.name AS dentist_name, c.name AS chair_name,
            CASE WHEN a.status = 'waiting' AND a.waiting_since IS NOT NULL
                 THEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - a.waiting_since)) / 60))::int END AS waiting_minutes
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN dentists d ON d.id = a.dentist_id
     LEFT JOIN dental_chairs c ON c.id = a.chair_id
     WHERE a.start_at >= ${localDayStart('$1', dateOrToday('$1', '$2'))}
       AND a.start_at < ${localDayStart('$1', dateOrToday('$1', '$2'))} + INTERVAL '1 day'
     ORDER BY a.start_at ASC`,
    [tz, date],
  )
  const items = rows.map((r) => ({
    ...mappers.appointment(r),
    patientName: r.patient_name,
    patientPhone: r.patient_phone,
    dentistName: r.dentist_name,
    chairName: r.chair_name ?? undefined,
    waitingMinutes: r.waiting_minutes ?? undefined,
  }))
  const by = (...statuses) => items.filter((i) => statuses.includes(i.status))
  const dayRes = date ?? (await query('SELECT (NOW() AT TIME ZONE $1::text)::date::text AS d', [tz])).rows[0].d
  res.json({
    date: dayRes,
    timezone: tz,
    waiting: by('waiting').sort((a, b) => (a.waitingSince ?? '').localeCompare(b.waitingSince ?? '')),
    inProgress: by('in_progress'),
    upcoming: by('pending', 'confirmed'),
    completed: by('completed'),
    cancelled: by('cancelled'),
    noShow: by('no_show'),
    counts: {
      total: items.length,
      waiting: by('waiting').length,
      inProgress: by('in_progress').length,
      upcoming: by('pending', 'confirmed').length,
      completed: by('completed').length,
      cancelled: by('cancelled').length,
      noShow: by('no_show').length,
    },
  })
})

export const deleteAppointment = wrap(async (req, res) => {
  const { rowCount } = await query('DELETE FROM appointments WHERE id = $1', [req.params.id])
  assertFound(rowCount, 'Cita')
  res.status(204).send()
})
