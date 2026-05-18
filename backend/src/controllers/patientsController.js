import { query } from '../config/database.js'
import { mappers } from '../utils/mappers.js'
import { createId } from '../utils/id.js'

export async function listPatients(_req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM patients ORDER BY updated_at DESC')
    res.json(rows.map(mappers.patient))
  } catch (e) {
    next(e)
  }
}

export async function getPatient(req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM patients WHERE id = $1', [req.params.id])
    if (!rows[0]) {
      const err = new Error('Paciente no encontrado')
      err.status = 404
      throw err
    }
    res.json(mappers.patient(rows[0]))
  } catch (e) {
    next(e)
  }
}

export async function createPatient(req, res, next) {
  try {
    const id = createId('p')
    const now = new Date().toISOString()
    const b = req.body
    const { rows } = await query(
      `INSERT INTO patients (id, first_name, last_name, document_id, birth_date, phone, email, address, status, allergies, medical_notes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12) RETURNING *`,
      [
        id,
        b.firstName,
        b.lastName,
        b.documentId,
        b.birthDate,
        b.phone,
        b.email,
        b.address ?? '',
        b.status ?? 'active',
        b.allergies ?? '',
        b.medicalNotes ?? '',
        now,
      ],
    )
    res.status(201).json(mappers.patient(rows[0]))
  } catch (e) {
    if (e.code === '23505') {
      e.status = 409
      e.message = 'Ya existe un paciente con ese documento'
    }
    next(e)
  }
}

export async function updatePatient(req, res, next) {
  try {
    const cur = await query('SELECT * FROM patients WHERE id = $1', [req.params.id])
    if (!cur.rows[0]) {
      const err = new Error('Paciente no encontrado')
      err.status = 404
      throw err
    }
    const b = req.body
    const r = cur.rows[0]
    const { rows } = await query(
      `UPDATE patients SET
        first_name = $2, last_name = $3, document_id = $4, birth_date = $5,
        phone = $6, email = $7, address = $8, status = $9,
        allergies = $10, medical_notes = $11, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        req.params.id,
        b.firstName ?? r.first_name,
        b.lastName ?? r.last_name,
        b.documentId ?? r.document_id,
        b.birthDate ?? r.birth_date,
        b.phone ?? r.phone,
        b.email ?? r.email,
        b.address ?? r.address,
        b.status ?? r.status,
        b.allergies ?? r.allergies,
        b.medicalNotes ?? r.medical_notes,
      ],
    )
    res.json(mappers.patient(rows[0]))
  } catch (e) {
    if (e.code === '23505') {
      e.status = 409
      e.message = 'Ya existe un paciente con ese documento'
    }
    next(e)
  }
}

export async function deletePatient(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM patients WHERE id = $1', [req.params.id])
    if (!rowCount) {
      const err = new Error('Paciente no encontrado')
      err.status = 404
      throw err
    }
    res.status(204).send()
  } catch (e) {
    next(e)
  }
}
