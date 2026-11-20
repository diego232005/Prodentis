import { query, withTransaction } from '../config/database.js'
import { mappers } from '../utils/mappers.js'
import { createId } from '../utils/id.js'
import { assertFound, httpError, wrap } from '../utils/http.js'
import { appTimezone, parseDateParam } from '../utils/time.js'

// ── Sillones ─────────────────────────────────────────────
export const listChairs = wrap(async (_req, res) => {
  const { rows } = await query('SELECT * FROM dental_chairs ORDER BY sort_order, name')
  res.json(rows.map(mappers.chair))
})

export const createChair = wrap(async (req, res) => {
  const b = req.body
  const { rows } = await query(
    `INSERT INTO dental_chairs (id, name, room, active, sort_order)
     VALUES ($1,$2,$3,$4,COALESCE($5, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM dental_chairs))) RETURNING *`,
    [createId('c'), b.name, b.room ?? '', b.active ?? true, b.sortOrder ?? null],
  )
  res.status(201).json(mappers.chair(rows[0]))
})

export const updateChair = wrap(async (req, res) => {
  const cur = assertFound((await query('SELECT * FROM dental_chairs WHERE id = $1', [req.params.id])).rows[0], 'Sillón')
  const b = req.body
  const { rows } = await query(
    'UPDATE dental_chairs SET name = $2, room = $3, active = $4, sort_order = $5 WHERE id = $1 RETURNING *',
    [cur.id, b.name ?? cur.name, b.room ?? cur.room, b.active ?? cur.active, b.sortOrder ?? cur.sort_order],
  )
  res.json(mappers.chair(rows[0]))
})

export const deleteChair = wrap(async (req, res) => {
  const used = await query(
    "SELECT 1 FROM appointments WHERE chair_id = $1 AND end_at > NOW() AND status NOT IN ('cancelled','no_show') LIMIT 1",
    [req.params.id],
  )
  if (used.rows[0]) throw httpError(409, 'El sillón tiene citas futuras; desactivalo en lugar de eliminarlo')
  const { rowCount } = await query('DELETE FROM dental_chairs WHERE id = $1', [req.params.id])
  assertFound(rowCount, 'Sillón')
  res.status(204).send()
})

// ── Disponibilidad semanal ───────────────────────────────
export const listAvailability = wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM dentist_availability WHERE ($1::varchar IS NULL OR dentist_id = $1::varchar)
     ORDER BY dentist_id, weekday, start_time`,
    [req.query.dentistId ?? null],
  )
  res.json(rows.map(mappers.availability))
})

/** Reemplaza toda la disponibilidad semanal del odontólogo. */
export const replaceAvailability = wrap(async (req, res) => {
  const dentistId = req.params.dentistId
  const slots = req.body.slots
  for (const s of slots) {
    if (s.endTime <= s.startTime) throw httpError(400, 'La hora de fin debe ser posterior al inicio en cada franja')
  }
  const rows = await withTransaction(async (client) => {
    assertFound((await client.query('SELECT 1 FROM dentists WHERE id = $1', [dentistId])).rows[0], 'Odontólogo')
    await client.query('DELETE FROM dentist_availability WHERE dentist_id = $1', [dentistId])
    const out = []
    for (const s of slots) {
      const r = await client.query(
        `INSERT INTO dentist_availability (id, dentist_id, weekday, start_time, end_time, active)
         VALUES ($1,$2,$3,$4::time,$5::time,$6) RETURNING *`,
        [createId('av'), dentistId, s.weekday, s.startTime, s.endTime, s.active ?? true],
      )
      out.push(r.rows[0])
    }
    return out
  })
  res.json(rows.map(mappers.availability))
})

// ── Bloqueos ─────────────────────────────────────────────
export const listBlocks = wrap(async (req, res) => {
  const { dentistId, from, to } = req.query
  const { rows } = await query(
    `SELECT * FROM dentist_blocks
     WHERE ($1::varchar IS NULL OR dentist_id = $1::varchar)
       AND ($2::timestamptz IS NULL OR end_at > $2::timestamptz)
       AND ($3::timestamptz IS NULL OR start_at < $3::timestamptz)
     ORDER BY start_at`,
    [dentistId ?? null, from ?? null, to ?? null],
  )
  res.json(rows.map(mappers.block))
})

export const createBlock = wrap(async (req, res) => {
  const b = req.body
  if (new Date(b.endAt) <= new Date(b.startAt)) throw httpError(400, 'La hora de fin debe ser posterior al inicio')
  const { rows } = await query(
    'INSERT INTO dentist_blocks (id, dentist_id, start_at, end_at, reason) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [createId('bl'), b.dentistId, b.startAt, b.endAt, b.reason ?? ''],
  )
  const conflicts = await query(
    `SELECT COUNT(*)::int AS n FROM appointments
     WHERE dentist_id = $1 AND status NOT IN ('cancelled','no_show') AND start_at < $3::timestamptz AND end_at > $2::timestamptz`,
    [b.dentistId, b.startAt, b.endAt],
  )
  res.status(201).json({ ...mappers.block(rows[0]), conflictingAppointments: conflicts.rows[0].n })
})

export const deleteBlock = wrap(async (req, res) => {
  const { rowCount } = await query('DELETE FROM dentist_blocks WHERE id = $1', [req.params.id])
  assertFound(rowCount, 'Bloqueo')
  res.status(204).send()
})

// ── Huecos libres ────────────────────────────────────────
export const listSlots = wrap(async (req, res) => {
  const tz = appTimezone()
  const date = parseDateParam(req.query.date)
  if (!date) throw httpError(400, 'Fecha inválida (YYYY-MM-DD)')
  const duration = Number(req.query.duration) || 30
  const step = Number(req.query.step) || 15
  const { rows } = await query(
    `SELECT g AS start_at, g + make_interval(mins => $3::int) AS end_at
     FROM dentist_availability a
     CROSS JOIN LATERAL generate_series(
       (($2::date + a.start_time) AT TIME ZONE $4::text),
       ((($2::date + a.end_time) AT TIME ZONE $4::text) - make_interval(mins => $3::int)),
       make_interval(mins => $5::int)
     ) AS g
     WHERE a.dentist_id = $1::varchar AND a.active
       AND a.weekday = EXTRACT(DOW FROM $2::date)::int
       AND g >= NOW()
       AND NOT EXISTS (
         SELECT 1 FROM appointments ap
         WHERE ap.status NOT IN ('cancelled','no_show')
           AND ap.start_at < g + make_interval(mins => $3::int) AND ap.end_at > g
           AND (ap.dentist_id = a.dentist_id OR ($6::varchar IS NOT NULL AND ap.chair_id = $6::varchar)))
       AND NOT EXISTS (
         SELECT 1 FROM dentist_blocks b
         WHERE b.dentist_id = a.dentist_id AND b.start_at < g + make_interval(mins => $3::int) AND b.end_at > g)
     ORDER BY g`,
    [req.query.dentistId, date, duration, tz, step, req.query.chairId ?? null],
  )
  res.json({
    date,
    timezone: tz,
    durationMinutes: duration,
    slots: rows.map((r) => ({ startAt: r.start_at.toISOString(), endAt: r.end_at.toISOString() })),
  })
})
