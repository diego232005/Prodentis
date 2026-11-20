import { body, param } from 'express-validator'

export const patientIdParam = [param('id').isString().notEmpty().withMessage('ID requerido')]

export const createPatientRules = [
  body('firstName').trim().isLength({ min: 2, max: 120 }),
  body('lastName').trim().isLength({ min: 2, max: 120 }),
  body('documentId').trim().isLength({ min: 6, max: 32 }),
  body('birthDate').isISO8601(),
  body('phone').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('address').optional().isString(),
  body('status').isIn(['active', 'inactive', 'archived']),
  body('allergies').optional().isString(),
  body('medicalNotes').optional().isString(),
  body('bloodType').optional().isIn(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('systemicConditions').optional().isString(),
  body('currentMedications').optional().isString(),
  body('emergencyContactName').optional().isString().isLength({ max: 255 }),
  body('emergencyContactPhone').optional().isString().isLength({ max: 64 }),
  body('isSmoker').optional().isBoolean().toBoolean(),
  body('isPregnant').optional().isBoolean().toBoolean(),
  body('takesAnticoagulants').optional().isBoolean().toBoolean(),
  body('anamnesisNotes').optional().isString(),
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
  body('bloodType').optional().isIn(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('systemicConditions').optional().isString(),
  body('currentMedications').optional().isString(),
  body('emergencyContactName').optional().isString().isLength({ max: 255 }),
  body('emergencyContactPhone').optional().isString().isLength({ max: 64 }),
  body('isSmoker').optional().isBoolean().toBoolean(),
  body('isPregnant').optional().isBoolean().toBoolean(),
  body('takesAnticoagulants').optional().isBoolean().toBoolean(),
  body('anamnesisNotes').optional().isString(),
]
