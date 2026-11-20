import { query, withTransaction } from '../config/database.js'
import { mappers } from '../utils/mappers.js'
import { createId } from '../utils/id.js'
import { assertFound, httpError, wrap } from '../utils/http.js'

export const DIAGNOSTIC_COLUMNS =
  'id, patient_id, dentist_id, kind, name, mime_type, size_bytes, tooth_id, notes, created_by, created_at'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACTOR_SQL = (n) => `(SELECT id FROM users WHERE id = $${n}::varchar)`
const actorId = (req) => req.actor?.id ?? null

// ── Entradas de historia clínica ─────────────────────────
export const listEntries = wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM clinical_entries WHERE ($1::varchar IS NULL OR patient_id = $1::varchar) ORDER BY created_at DESC`,
    [req.query.patientId ?? null],
  )
  res.json(rows.map(mappers.clinical))
})

export const createEntry = wrap(async (req, res) => {
  const b = req.body
  const { rows } = await query(
    `INSERT INTO clinical_entries (id, patient_id, dentist_id, appointment_id, tooth_id, type, title, content,
       diagnosis_code, procedure_id, attachment_name, created_by, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, ${ACTOR_SQL(12)}, NOW()) RETURNING *`,
    [
      createId('c'), b.patientId, b.dentistId, b.appointmentId ?? null, b.toothId ?? null, b.type, b.title, b.content,
      b.diagnosisCode ?? null, b.procedureId ?? null, b.attachmentName ?? null, actorId(req),
    ],
  )
  res.status(201).json(mappers.clinical(rows[0]))
})

export const updateEntry = wrap(async (req, res) => {
  const cur = assertFound((await query('SELECT * FROM clinical_entries WHERE id = $1', [req.params.id])).rows[0], 'Registro clínico')
  const b = req.body
  const pick = (key, col) => (key in b ? b[key] ?? null : cur[col])
  const { rows } = await query(
    `UPDATE clinical_entries SET type = $2, title = $3, content = $4, diagnosis_code = $5, procedure_id = $6,
       attachment_name = $7, tooth_id = $8, appointment_id = $9, updated_at = NOW(), updated_by = ${ACTOR_SQL(10)}
     WHERE id = $1 RETURNING *`,
    [
      cur.id, b.type ?? cur.type, b.title ?? cur.title, b.content ?? cur.content, pick('diagnosisCode', 'diagnosis_code'),
      pick('procedureId', 'procedure_id'), pick('attachmentName', 'attachment_name'), pick('toothId', 'tooth_id'),
      pick('appointmentId', 'appointment_id'), actorId(req),
    ],
  )
  res.json(mappers.clinical(rows[0]))
})

export const deleteEntry = wrap(async (req, res) => {
  const { rowCount } = await query('DELETE FROM clinical_entries WHERE id = $1', [req.params.id])
  assertFound(rowCount, 'Registro clínico')
  res.status(204).send()
})

// ── Odontograma y snapshots ──────────────────────────────
export const getOdontogram = wrap(async (req, res) => {
  const { rows } = await query('SELECT * FROM odontograms WHERE patient_id = $1', [req.params.patientId])
  res.json(rows[0] ? mappers.odontogram(rows[0]) : { patientId: req.params.patientId, teeth: [], updatedAt: null })
})

export const saveOdontogram = wrap(async (req, res) => {
  const { teeth, snapshot, note } = req.body
  const saved = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO odontograms (patient_id, teeth, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (patient_id) DO UPDATE SET teeth = EXCLUDED.teeth, updated_at = NOW() RETURNING *`,
      [req.params.patientId, JSON.stringify(teeth)],
    )
    if (snapshot) {
      await client.query(
        `INSERT INTO odontogram_snapshots (id, patient_id, teeth, note, created_by)
         VALUES ($1, $2, $3::jsonb, $4, ${ACTOR_SQL(5)})`,
        [createId('os'), req.params.patientId, JSON.stringify(teeth), note ?? '', actorId(req)],
      )
    }
    return rows[0]
  })
  res.json(mappers.odontogram(saved))
})

export const listSnapshots = wrap(async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM odontogram_snapshots WHERE patient_id = $1 ORDER BY created_at DESC',
    [req.params.patientId],
  )
  res.json(rows.map(mappers.snapshot))
})

export const createSnapshot = wrap(async (req, res) => {
  const cur = assertFound(
    (await query('SELECT teeth FROM odontograms WHERE patient_id = $1', [req.params.patientId])).rows[0],
    'Odontograma',
  )
  const { rows } = await query(
    `INSERT INTO odontogram_snapshots (id, patient_id, teeth, note, created_by)
     VALUES ($1, $2, $3::jsonb, $4, ${ACTOR_SQL(5)}) RETURNING *`,
    [createId('os'), req.params.patientId, JSON.stringify(cur.teeth), req.body.note ?? '', actorId(req)],
  )
  res.status(201).json(mappers.snapshot(rows[0]))
})

// ── Periodontograma ──────────────────────────────────────
export const listPeriodontograms = wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM periodontograms WHERE ($1::varchar IS NULL OR patient_id = $1::varchar) ORDER BY created_at DESC`,
    [req.query.patientId ?? null],
  )
  res.json(rows.map(mappers.periodontogram))
})

export const createPeriodontogram = wrap(async (req, res) => {
  const b = req.body
  const { rows } = await query(
    `INSERT INTO periodontograms (id, patient_id, dentist_id, data, notes) VALUES ($1,$2,$3,$4::jsonb,$5) RETURNING *`,
    [createId('pg'), b.patientId, b.dentistId ?? null, JSON.stringify(b.data), b.notes ?? ''],
  )
  res.status(201).json(mappers.periodontogram(rows[0]))
})

export const deletePeriodontogram = wrap(async (req, res) => {
  const { rowCount } = await query('DELETE FROM periodontograms WHERE id = $1', [req.params.id])
  assertFound(rowCount, 'Periodontograma')
  res.status(204).send()
})

// ── Medicamentos y recetas ───────────────────────────────
export const listMedications = wrap(async (_req, res) => {
  const { rows } = await query('SELECT * FROM medications ORDER BY name')
  res.json(rows.map(mappers.medication))
})

export const createMedication = wrap(async (req, res) => {
  const b = req.body
  const { rows } = await query(
    `INSERT INTO medications (id, name, presentation, default_dosage, category) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [createId('med'), b.name, b.presentation ?? '', b.defaultDosage ?? '', b.category ?? ''],
  )
  res.status(201).json(mappers.medication(rows[0]))
})

export const updateMedication = wrap(async (req, res) => {
  const cur = assertFound((await query('SELECT * FROM medications WHERE id = $1', [req.params.id])).rows[0], 'Medicamento')
  const b = req.body
  const { rows } = await query(
    `UPDATE medications SET name = $2, presentation = $3, default_dosage = $4, category = $5, active = $6
     WHERE id = $1 RETURNING *`,
    [
      cur.id, b.name ?? cur.name, b.presentation ?? cur.presentation, b.defaultDosage ?? cur.default_dosage,
      b.category ?? cur.category, b.active ?? cur.active,
    ],
  )
  res.json(mappers.medication(rows[0]))
})

export const listPrescriptions = wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM prescriptions WHERE ($1::varchar IS NULL OR patient_id = $1::varchar) ORDER BY created_at DESC`,
    [req.query.patientId ?? null],
  )
  res.json(rows.map(mappers.prescription))
})

export const createPrescription = wrap(async (req, res) => {
  const b = req.body
  const { rows } = await query(
    `INSERT INTO prescriptions (id, patient_id, dentist_id, appointment_id, diagnosis, items, notes)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7) RETURNING *`,
    [createId('rx'), b.patientId, b.dentistId, b.appointmentId ?? null, b.diagnosis ?? '', JSON.stringify(b.items), b.notes ?? ''],
  )
  res.status(201).json(mappers.prescription(rows[0]))
})

export const deletePrescription = wrap(async (req, res) => {
  const { rowCount } = await query('DELETE FROM prescriptions WHERE id = $1', [req.params.id])
  assertFound(rowCount, 'Receta')
  res.status(204).send()
})

// ── Archivos diagnósticos ────────────────────────────────
export const listDiagnostics = wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT ${DIAGNOSTIC_COLUMNS} FROM diagnostic_files
     WHERE ($1::varchar IS NULL OR patient_id = $1::varchar) ORDER BY created_at DESC`,
    [req.query.patientId ?? null],
  )
  res.json(rows.map(mappers.diagnostic))
})

export const getDiagnosticFile = wrap(async (req, res) => {
  const { rows } = await query('SELECT * FROM diagnostic_files WHERE id = $1', [req.params.id])
  res.json(mappers.diagnostic(assertFound(rows[0], 'Archivo')))
})

export const createDiagnostic = wrap(async (req, res) => {
  const b = req.body
  const match = /^data:([\w.+-]+\/[\w.+-]+);base64,(.+)$/s.exec(b.dataUrl)
  if (!match) throw httpError(400, 'El archivo debe enviarse como data URL base64')
  const size = Math.floor((match[2].length * 3) / 4)
  if (size > MAX_FILE_BYTES) throw httpError(413, 'El archivo supera el máximo de 10 MB')
  const { rows } = await query(
    `INSERT INTO diagnostic_files (id, patient_id, dentist_id, kind, name, mime_type, size_bytes, tooth_id, notes, data_url, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, ${ACTOR_SQL(11)}) RETURNING ${DIAGNOSTIC_COLUMNS}`,
    [
      createId('df'), b.patientId, b.dentistId ?? null, b.kind ?? 'other', b.name, match[1], size, b.toothId ?? null,
      b.notes ?? '', b.dataUrl, actorId(req),
    ],
  )
  res.status(201).json(mappers.diagnostic(rows[0]))
})

export const deleteDiagnostic = wrap(async (req, res) => {
  const { rowCount } = await query('DELETE FROM diagnostic_files WHERE id = $1', [req.params.id])
  assertFound(rowCount, 'Archivo')
  res.status(204).send()
})
