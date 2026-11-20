import { body, param, query } from 'express-validator'

const idParam = (name = 'id') => param(name).isString().notEmpty()
const optId = (name) => body(name).optional({ nullable: true }).isString().notEmpty()
const reqId = (name) => body(name).isString().notEmpty()
const optQueryId = (name) => query(name).optional().isString().notEmpty()

export const idRules = [idParam()]
export const patientIdRules = [idParam('patientId')]
export const patientQueryRules = [optQueryId('patientId')]

// ── Auth ─────────────────────────────────────────────────
export const loginRules = [body('email').isEmail(), body('password').isString().notEmpty()]

// ── Clínica ──────────────────────────────────────────────
const entryTypes = ['evolution', 'diagnosis', 'procedure', 'note', 'attachment', 'consultation']

export const createEntryRules = [
  reqId('patientId'),
  reqId('dentistId'),
  optId('appointmentId'),
  body('toothId').optional({ nullable: true }).isString().isLength({ max: 8 }),
  body('type').isIn(entryTypes),
  body('title').trim().isLength({ min: 1, max: 255 }),
  body('content').isString().notEmpty(),
  body('diagnosisCode').optional({ nullable: true }).isString().isLength({ max: 32 }),
  optId('procedureId'),
  body('attachmentName').optional({ nullable: true }).isString().isLength({ max: 255 }),
]

export const updateEntryRules = [
  idParam(),
  optId('appointmentId'),
  body('toothId').optional({ nullable: true }).isString().isLength({ max: 8 }),
  body('type').optional().isIn(entryTypes),
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('content').optional().isString().notEmpty(),
  body('diagnosisCode').optional({ nullable: true }).isString().isLength({ max: 32 }),
  optId('procedureId'),
  body('attachmentName').optional({ nullable: true }).isString().isLength({ max: 255 }),
]

export const saveOdontogramRules = [
  idParam('patientId'),
  body('teeth').isArray({ max: 52 }),
  body('teeth.*.toothId').isString().notEmpty(),
  body('teeth.*.status').isString().notEmpty(),
  body('snapshot').optional().isBoolean().toBoolean(),
  body('note').optional().isString(),
]

export const snapshotRules = [idParam('patientId'), body('note').optional().isString()]

export const periodontogramRules = [
  reqId('patientId'),
  optId('dentistId'),
  body('data').isObject(),
  body('notes').optional().isString(),
]

export const createMedicationRules = [
  body('name').trim().isLength({ min: 2, max: 255 }),
  body('presentation').optional().isString(),
  body('defaultDosage').optional().isString(),
  body('category').optional().isString(),
]
export const updateMedicationRules = [
  idParam(),
  body('name').optional().trim().isLength({ min: 2, max: 255 }),
  body('presentation').optional().isString(),
  body('defaultDosage').optional().isString(),
  body('category').optional().isString(),
  body('active').optional().isBoolean().toBoolean(),
]

export const prescriptionRules = [
  reqId('patientId'),
  reqId('dentistId'),
  optId('appointmentId'),
  body('diagnosis').optional().isString(),
  body('items').isArray({ min: 1, max: 30 }),
  body('items.*.name').isString().trim().notEmpty(),
  body('items.*.dosage').optional().isString(),
  body('items.*.frequency').optional().isString(),
  body('items.*.duration').optional().isString(),
  body('items.*.instructions').optional().isString(),
  body('notes').optional().isString(),
]

export const diagnosticRules = [
  reqId('patientId'),
  optId('dentistId'),
  body('kind').optional().isIn(['xray', 'photo', 'scan', 'lab', 'other']),
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('toothId').optional({ nullable: true }).isString().isLength({ max: 8 }),
  body('notes').optional().isString(),
  body('dataUrl').isString().notEmpty(),
]

// ── Facturación ──────────────────────────────────────────
export const createInvoiceRules = [
  reqId('patientId'),
  body('issuedAt').optional().isISO8601(),
  body('dueAt').optional().isISO8601(),
  body('taxRate').optional().isFloat({ min: 0, max: 1 }).toFloat(),
  body('notes').optional().isString(),
  body('lines').isArray({ min: 1, max: 50 }),
  body('lines.*.description').isString().trim().notEmpty(),
  body('lines.*.quantity').isFloat({ gt: 0 }).toFloat(),
  body('lines.*.unitPrice').isFloat({ min: 0 }).toFloat(),
  body('lines.*.treatmentId').optional({ nullable: true }).isString(),
]

export const voidInvoiceRules = [idParam(), body('reason').optional().isString()]

export const paymentRules = [
  idParam(),
  body('amount').isFloat({ gt: 0 }).toFloat(),
  body('method').isIn(['cash', 'card', 'transfer']),
  body('reference').optional().isString(),
  body('paidAt').optional().isISO8601(),
]

export const paymentQueryRules = [
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  optQueryId('invoiceId'),
]

export const dateQueryRules = [query('date').optional().isISO8601()]

export const cashClosureRules = [
  body('date').optional().isISO8601(),
  body('countedCash').isFloat({ min: 0 }).toFloat(),
  body('notes').optional().isString(),
]

// ── Agenda ───────────────────────────────────────────────
export const createChairRules = [
  body('name').trim().isLength({ min: 1, max: 120 }),
  body('room').optional().isString(),
  body('active').optional().isBoolean().toBoolean(),
  body('sortOrder').optional().isInt({ min: 0 }).toInt(),
]
export const updateChairRules = [
  idParam(),
  body('name').optional().trim().isLength({ min: 1, max: 120 }),
  body('room').optional().isString(),
  body('active').optional().isBoolean().toBoolean(),
  body('sortOrder').optional().isInt({ min: 0 }).toInt(),
]

export const dentistParamRules = [idParam('dentistId')]
export const availabilityRules = [
  idParam('dentistId'),
  body('slots').isArray({ max: 70 }),
  body('slots.*.weekday').isInt({ min: 0, max: 6 }).toInt(),
  body('slots.*.startTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('slots.*.endTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('slots.*.active').optional().isBoolean().toBoolean(),
]

export const blockRules = [
  reqId('dentistId'),
  body('startAt').isISO8601(),
  body('endAt').isISO8601(),
  body('reason').optional().isString(),
]

export const blockQueryRules = [
  optQueryId('dentistId'),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
]

export const slotsQueryRules = [
  query('dentistId').isString().notEmpty(),
  query('date').matches(/^\d{4}-\d{2}-\d{2}$/),
  query('duration').optional().isInt({ min: 5, max: 480 }),
  query('step').optional().isInt({ min: 5, max: 120 }),
  optQueryId('chairId'),
]

// ── Consentimientos ──────────────────────────────────────
export const createTemplateRules = [
  body('code').trim().isLength({ min: 2, max: 32 }),
  body('title').trim().isLength({ min: 2, max: 255 }),
  body('category').optional().isString(),
  body('body').isString().notEmpty(),
]
export const updateTemplateRules = [
  idParam(),
  body('code').optional().trim().isLength({ min: 2, max: 32 }),
  body('title').optional().trim().isLength({ min: 2, max: 255 }),
  body('category').optional().isString(),
  body('body').optional().isString().notEmpty(),
  body('active').optional().isBoolean().toBoolean(),
]

export const createConsentRules = [
  reqId('patientId'),
  optId('dentistId'),
  optId('templateId'),
  optId('appointmentId'),
  body('title').optional().isString().trim().notEmpty(),
  body('body').optional().isString().notEmpty(),
]

export const signConsentRules = [
  idParam(),
  body('signatureData').isString().notEmpty(),
  body('signedByName').trim().isLength({ min: 2, max: 255 }),
]

// ── Tratamientos y planes ────────────────────────────────
const treatmentStatuses = ['planned', 'in_progress', 'completed', 'cancelled']

export const createTreatmentRules = [
  reqId('patientId'),
  reqId('dentistId'),
  reqId('procedureId'),
  body('status').optional().isIn(treatmentStatuses),
  body('startDate').optional().isISO8601(),
  body('endDate').optional({ nullable: true }).isISO8601(),
  body('sessionsPlanned').optional().isInt({ min: 1 }).toInt(),
  body('sessionsDone').optional().isInt({ min: 0 }).toInt(),
  body('cost').isFloat({ min: 0 }).toFloat(),
  body('notes').optional().isString(),
]
export const updateTreatmentRules = [
  idParam(),
  body('dentistId').optional().isString().notEmpty(),
  body('procedureId').optional().isString().notEmpty(),
  body('status').optional().isIn(treatmentStatuses),
  body('startDate').optional().isISO8601(),
  body('endDate').optional({ nullable: true }).isISO8601(),
  body('sessionsPlanned').optional().isInt({ min: 1 }).toInt(),
  body('sessionsDone').optional().isInt({ min: 0 }).toInt(),
  body('cost').optional().isFloat({ min: 0 }).toFloat(),
  body('notes').optional().isString(),
]

const planItemRules = [
  body('items').optional().isArray({ max: 100 }),
  body('items.*.procedureId').optional({ nullable: true }).isString(),
  body('items.*.description').optional().isString().trim().notEmpty(),
  body('items.*.toothId').optional({ nullable: true }).isString().isLength({ max: 8 }),
  body('items.*.quantity').optional().isFloat({ gt: 0 }).toFloat(),
  body('items.*.unitPrice').optional().isFloat({ min: 0 }).toFloat(),
  body('items.*.status').optional().isIn(['pending', 'done', 'cancelled']),
  body('items.*').custom((it) => Boolean(it.procedureId || it.description)).withMessage('Cada ítem requiere procedimiento o descripción'),
]
const planStatuses = ['draft', 'proposed', 'approved', 'in_progress', 'completed', 'cancelled']

export const createPlanRules = [
  reqId('patientId'),
  reqId('dentistId'),
  body('title').trim().isLength({ min: 2, max: 255 }),
  body('status').optional().isIn(planStatuses),
  body('discount').optional().isFloat({ min: 0 }).toFloat(),
  body('notes').optional().isString(),
  ...planItemRules,
]
export const updatePlanRules = [
  idParam(),
  body('title').optional().trim().isLength({ min: 2, max: 255 }),
  body('status').optional().isIn(planStatuses),
  body('discount').optional().isFloat({ min: 0 }).toFloat(),
  body('notes').optional().isString(),
  ...planItemRules,
]
export const planItemStatusRules = [idParam('itemId'), body('status').isIn(['pending', 'done', 'cancelled'])]
