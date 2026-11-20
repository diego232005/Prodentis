import { body, param } from 'express-validator'

export const appointmentStatuses = ['pending', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show']

export const appointmentIdParam = [param('id').isString().notEmpty()]

export const createAppointmentRules = [
  body('patientId').isString().notEmpty(),
  body('dentistId').isString().notEmpty(),
  body('chairId').optional({ nullable: true }).isString().notEmpty(),
  body('procedureId').optional({ nullable: true }).isString().notEmpty(),
  body('startAt').isISO8601(),
  body('endAt').isISO8601(),
  body('status').optional().isIn(appointmentStatuses),
  body('reason').optional().isString(),
  body('notes').optional().isString(),
  body('cancelReason').optional().isString(),
]

export const updateAppointmentRules = [
  ...appointmentIdParam,
  body('patientId').optional().isString().notEmpty(),
  body('dentistId').optional().isString().notEmpty(),
  body('chairId').optional({ nullable: true }).isString().notEmpty(),
  body('procedureId').optional({ nullable: true }).isString().notEmpty(),
  body('startAt').optional().isISO8601(),
  body('endAt').optional().isISO8601(),
  body('status').optional().isIn(appointmentStatuses),
  body('reason').optional().isString(),
  body('notes').optional().isString(),
  body('cancelReason').optional().isString(),
]

export const cancelAppointmentRules = [
  ...appointmentIdParam,
  body('reason').isString().trim().isLength({ min: 3, max: 500 }).withMessage('Motivo de cancelación requerido'),
]

export const noShowRules = [...appointmentIdParam, body('reason').optional().isString()]

export const receptionBoardRules = [param('date').optional().isISO8601()]
