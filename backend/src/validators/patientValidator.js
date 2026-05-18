import { body, param } from 'express-validator'

export const patientIdParam = [param('id').isString().notEmpty().withMessage('ID requerido')]

export const createPatientRules = [
  body('firstName').trim().isLength({ min: 2, max: 120 }),
  body('lastName').trim().isLength({ min: 2, max: 120 }),
  body('documentId').trim().isLength({ min: 6, max: 32 }),
  body('birthDate').isISO8601().toDate(),
  body('phone').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('address').optional().isString(),
  body('status').isIn(['active', 'inactive', 'archived']),
  body('allergies').optional().isString(),
  body('medicalNotes').optional().isString(),
]

export const updatePatientRules = [
  ...patientIdParam,
  body('firstName').optional().trim().isLength({ min: 2, max: 120 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 120 }),
  body('documentId').optional().trim().isLength({ min: 6, max: 32 }),
  body('birthDate').optional().isISO8601(),
  body('phone').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('address').optional().isString(),
  body('status').optional().isIn(['active', 'inactive', 'archived']),
  body('allergies').optional().isString(),
  body('medicalNotes').optional().isString(),
]
