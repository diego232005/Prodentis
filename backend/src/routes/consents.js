import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { clinicalWrite, requireRoles } from '../middleware/rbac.js'
import * as v from '../validators/hisValidator.js'
import * as ctrl from '../controllers/consentsController.js'

const router = Router()
const consentWrite = requireRoles('dentist', 'receptionist', 'assistant')

router.get('/templates', ctrl.listTemplates)
router.post('/templates', clinicalWrite, v.createTemplateRules, validate, ctrl.createTemplate)
router.put('/templates/:id', clinicalWrite, v.updateTemplateRules, validate, ctrl.updateTemplate)

router.get('/', v.patientQueryRules, validate, ctrl.listConsents)
router.get('/:id', v.idRules, validate, ctrl.getConsent)
router.post('/', consentWrite, v.createConsentRules, validate, ctrl.createConsent)
router.post('/:id/sign', consentWrite, v.signConsentRules, validate, ctrl.signConsent)
router.post('/:id/revoke', clinicalWrite, v.idRules, validate, ctrl.revokeConsent)
router.delete('/:id', consentWrite, v.idRules, validate, ctrl.deleteConsent)

export default router