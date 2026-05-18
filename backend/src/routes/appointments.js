import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import {
  appointmentIdParam,
  createAppointmentRules,
  updateAppointmentRules,
} from '../validators/appointmentValidator.js'
import * as ctrl from '../controllers/appointmentsController.js'

const router = Router()

router.get('/', ctrl.listAppointments)
router.get('/:id', appointmentIdParam, validate, ctrl.getAppointment)
router.post('/', createAppointmentRules, validate, ctrl.createAppointment)
router.put('/:id', updateAppointmentRules, validate, ctrl.updateAppointment)
router.delete('/:id', appointmentIdParam, validate, ctrl.deleteAppointment)

export default router
