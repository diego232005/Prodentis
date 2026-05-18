import { body, param } from 'express-validator'

const statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']

export const appointmentIdParam = [param('id').isString().notEmpty()]

export const createAppointmentRules = [
  body('patientId').isString().notEmpty(),
  body('dentistId').isString().notEmpty(),
  body('startAt').isISO8601(),
  body('endAt').isISO8601(),
  body('status').optional().isIn(statuses),
  body('reason').optional().isString(),
  body('notes').optional().isString(),
]

export const updateAppointmentRules = [
  ...appointmentIdParam,
  body('patientId').optional().isString().notEmpty(),
  body('dentistId').optional().isString().notEmpty(),
  body('startAt').optional().isISO8601(),
  body('endAt').optional().isISO8601(),
  body('status').optional().isIn(statuses),
  body('reason').optional().isString(),
  body('notes').optional().isString(),
]
