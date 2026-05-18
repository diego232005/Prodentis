import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import {
  createPatientRules,
  patientIdParam,
  updatePatientRules,
} from '../validators/patientValidator.js'
import * as ctrl from '../controllers/patientsController.js'

const router = Router()

router.get('/', ctrl.listPatients)
router.get('/:id', patientIdParam, validate, ctrl.getPatient)
router.post('/', createPatientRules, validate, ctrl.createPatient)
router.put('/:id', updatePatientRules, validate, ctrl.updatePatient)
router.delete('/:id', patientIdParam, validate, ctrl.deletePatient)

export default router
