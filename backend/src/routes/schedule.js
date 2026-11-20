import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { receptionWrite } from '../middleware/rbac.js'
import * as v from '../validators/hisValidator.js'
import * as ctrl from '../controllers/scheduleController.js'

const router = Router()

router.get('/chairs', ctrl.listChairs)
router.post('/chairs', receptionWrite, v.createChairRules, validate, ctrl.createChair)
router.put('/chairs/:id', receptionWrite, v.updateChairRules, validate, ctrl.updateChair)
router.delete('/chairs/:id', receptionWrite, v.idRules, validate, ctrl.deleteChair)

router.get('/availability', ctrl.listAvailability)
router.put('/availability/:dentistId', receptionWrite, v.availabilityRules, validate, ctrl.replaceAvailability)

router.get('/blocks', v.blockQueryRules, validate, ctrl.listBlocks)
router.post('/blocks', receptionWrite, v.blockRules, validate, ctrl.createBlock)
router.delete('/blocks/:id', receptionWrite, v.idRules, validate, ctrl.deleteBlock)

router.get('/slots', v.slotsQueryRules, validate, ctrl.listSlots)

export default router