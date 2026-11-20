import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { appointmentUpdate, receptionWrite } from '../middleware/rbac.js'
import {
  appointmentIdParam,
  cancelAppointmentRules,
  createAppointmentRules,
  noShowRules,
  updateAppointmentRules,
} from '../validators/appointmentValidator.js'
import * as ctrl from '../controllers/appointmentsController.js'

const router = Router()

router.get('/', ctrl.listAppointments)
router.get('/reception-board', ctrl.receptionBoard)
router.get('/:id', appointmentIdParam, validate, ctrl.getAppointment)
router.post('/', receptionWrite, createAppointmentRules, validate, ctrl.createAppointment)
router.put('/:id', appointmentUpdate, updateAppointmentRules, validate, ctrl.updateAppointment)
router.post('/:id/cancel', receptionWrite, cancelAppointmentRules, validate, ctrl.cancelAppointment)
router.post('/:id/check-in', receptionWrite, appointmentIdParam, validate, ctrl.checkInAppointment)
router.post('/:id/no-show', receptionWrite, noShowRules, validate, ctrl.markNoShow)
router.delete('/:id', receptionWrite, appointmentIdParam, validate, ctrl.deleteAppointment)

export default router
