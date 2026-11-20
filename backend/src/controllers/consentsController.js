import { query } from '../config/database.js'
import { mappers } from '../utils/mappers.js'
import { createId } from '../utils/id.js'
import { assertFound, httpError, wrap } from '../utils/http.js'
import { appTimezone } from '../utils/time.js'

/** Columnas livianas (sin firma) para listados y bootstrap. */
export const CONSENT_COLUMNS =
  'id, patient_id, dentist_id, template_id, appointment_id, title, body, status, signed_by_name, signed_at, created_by, created_at, (signature_data IS NOT NULL) AS has_signature'

const MAX_SIGNATURE_CHARS = 2_000_000

// ── Plantillas ───────────────────────────────────────────
export const listTemplates = wrap(async (_req, res) => {
  const { rows } = await query('SELECT * FROM consent_templates ORDER BY title')
  res.json(rows.map(mappers.consentTemplate))
})

export const createTemplate = wrap(async (req, res) => {
  const b = req.body
  const { rows } = await query(
    'INSERT INTO consent_templates (id, code, title, category, body) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [createId('ct'), b.code, b.title, b.category ?? '', b.body],
  )
  res.status(201).json(mappers.consentTemplate(rows[0]))
})

export const updateTemplate = wrap(async (req, res) => {
  const cur = assertFound((await query('SELECT * FROM consent_templates WHERE id = $1', [req.params.id])).rows[0], 'Plantilla')
  const b = req.body
  const { rows } = await query(
    `UPDATE consent_templates SET code = $2, title = $3, category = $4, body = $5, active = $6, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [cur.id, b.code ?? cur.code, b.title ?? cur.title, b.category ?? cur.category, b.body ?? cur.body, b.active ?? cur.active],
  )
  res.json(mappers.consentTemplate(rows[0]))
})

// ── Consentimientos ──────────────────────────────────────
export const listConsents = wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT ${CONSENT_COLUMNS} FROM consents WHERE ($1::varchar IS NULL OR patient_id = $1::varchar) ORDER BY created_at DESC`,
    [req.query.patientId ?? null],
  )
  res.json(rows.map(mappers.consent))
})

export const getConsent = wrap(async (req, res) => {
  const { rows } = await query('SELECT * FROM consents WHERE id = $1', [req.params.id])
  res.json(mappers.consent(assertFound(rows[0], 'Consentimiento')))
})

function render(body, vars) {
  return body.replace(/\{\{(\w+)\}\}/g, (m, k) => vars[k] ?? m)
}

export const createConsent = wrap(async (req, res) => {
  const b = req.body
  const patient = assertFound((await query('SELECT * FROM patients WHERE id = $1', [b.patientId])).rows[0], 'Paciente')
  let title = b.title
  let body = b.body
  if (b.templateId) {
    const tpl = assertFound((await query('SELECT * FROM consent_templates WHERE id = $1', [b.templateId])).rows[0], 'Plantilla')
    title = title ?? tpl.title
    body = body ?? tpl.body
  }
  if (!title || !body) throw httpError(400, 'Indicá una plantilla o título y texto del consentimiento')
  const dentist = b.dentistId
    ? (await query('SELECT name FROM dentists WHERE id = $1', [b.dentistId])).rows[0]
    : null
  const date = new Intl.DateTimeFormat('es-AR', { timeZone: appTimezone(), dateStyle: 'long' }).format(new Date())
  const text = render(body, {
    patient: `${patient.first_name} ${patient.last_name}`,
    document: patient.document_id,
    dentist: dentist?.name ?? '',
    date,
  })
  const { rows } = await query(
    `INSERT INTO consents (id, patient_id, dentist_id, template_id, appointment_id, title, body, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,(SELECT id FROM users WHERE id = $8::varchar)) RETURNING *`,
    [createId('cn'), b.patientId, b.dentistId ?? null, b.templateId ?? null, b.appointmentId ?? null, title, text, req.actor?.id ?? null],
  )
  res.status(201).json(mappers.consent(rows[0]))
})

export const signConsent = wrap(async (req, res) => {
  const b = req.body
  if (!/^data:image\/(png|jpeg|svg\+xml);base64,/.test(b.signatureData)) throw httpError(400, 'Firma inválida (se espera imagen base64)')
  if (b.signatureData.length > MAX_SIGNATURE_CHARS) throw httpError(413, 'La firma es demasiado grande')
  const cur = assertFound((await query('SELECT status FROM consents WHERE id = $1', [req.params.id])).rows[0], 'Consentimiento')
  if (cur.status !== 'pending') throw httpError(409, `El consentimiento está "${cur.status}"`)
  const { rows } = await query(
    `UPDATE consents SET status = 'signed', signature_data = $2, signed_by_name = $3, signed_at = NOW()
     WHERE id = $1 RETURNING *`,
    [req.params.id, b.signatureData, b.signedByName],
  )
  res.json(mappers.consent(rows[0]))
})

export const revokeConsent = wrap(async (req, res) => {
  const { rows } = await query(
    `UPDATE consents SET status = 'revoked' WHERE id = $1 AND status <> 'revoked' RETURNING *`,
    [req.params.id],
  )
  if (!rows[0]) {
    assertFound((await query('SELECT 1 FROM consents WHERE id = $1', [req.params.id])).rows[0], 'Consentimiento')
    throw httpError(409, 'El consentimiento ya fue revocado')
  }
  res.json(mappers.consent(rows[0]))
})

export const deleteConsent = wrap(async (req, res) => {
  const { rowCount } = await query("DELETE FROM consents WHERE id = $1 AND status = 'pending'", [req.params.id])
  if (!rowCount) throw httpError(409, 'Solo se pueden eliminar consentimientos pendientes (los firmados se revocan)')
  res.status(204).send()
})
