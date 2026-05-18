import { query } from '../config/database.js'
import { mappers } from '../utils/mappers.js'
import { createId } from '../utils/id.js'

export async function listAppointments(_req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM appointments ORDER BY start_at ASC')
    res.json(rows.map(mappers.appointment))
  } catch (e) {
    next(e)
  }
}

export async function getAppointment(req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM appointments WHERE id = $1', [req.params.id])
    if (!rows[0]) {
      const err = new Error('Cita no encontrada')
      err.status = 404
      throw err
    }
    res.json(mappers.appointment(rows[0]))
  } catch (e) {
    next(e)
  }
}

export async function createAppointment(req, res, next) {
  try {
    const id = createId('a')
    const now = new Date().toISOString()
    const b = req.body
    if (new Date(b.endAt) <= new Date(b.startAt)) {
      const err = new Error('La hora de fin debe ser posterior al inicio')
      err.status = 400
      throw err
    }
    const { rows } = await query(
      `INSERT INTO appointments (id, patient_id, dentist_id, start_at, end_at, status, reason, notes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) RETURNING *`,
      [id, b.patientId, b.dentistId, b.startAt, b.endAt, b.status ?? 'pending', b.reason ?? '', b.notes ?? '', now],
    )
    res.status(201).json(mappers.appointment(rows[0]))
  } catch (e) {
    if (e.code === '23503') {
      e.status = 400
      e.message = 'Paciente u odontólogo no válido'
    }
    next(e)
  }
}

export async function updateAppointment(req, res, next) {
  try {
    const cur = await query('SELECT * FROM appointments WHERE id = $1', [req.params.id])
    if (!cur.rows[0]) {
      const err = new Error('Cita no encontrada')
      err.status = 404
      throw err
    }
    const b = req.body
    const r = cur.rows[0]
    const startAt = b.startAt ?? r.start_at
    const endAt = b.endAt ?? r.end_at
    if (new Date(endAt) <= new Date(startAt)) {
      const err = new Error('La hora de fin debe ser posterior al inicio')
      err.status = 400
      throw err
    }
    const { rows } = await query(
      `UPDATE appointments SET
        patient_id = $2, dentist_id = $3, start_at = $4, end_at = $5,
        status = $6, reason = $7, notes = $8, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        req.params.id,
        b.patientId ?? r.patient_id,
        b.dentistId ?? r.dentist_id,
        startAt,
        endAt,
        b.status ?? r.status,
        b.reason ?? r.reason,
        b.notes ?? r.notes,
      ],
    )
    res.json(mappers.appointment(rows[0]))
  } catch (e) {
    next(e)
  }
}

export async function deleteAppointment(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM appointments WHERE id = $1', [req.params.id])
    if (!rowCount) {
      const err = new Error('Cita no encontrada')
      err.status = 404
      throw err
    }
    res.status(204).send()
  } catch (e) {
    next(e)
  }
}
