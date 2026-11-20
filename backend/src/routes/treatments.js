import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { clinicalWrite } from '../middleware/rbac.js'
import * as v from '../validators/hisValidator.js'
import * as ctrl from '../controllers/treatmentsController.js'

const router = Router()

router.get('/plans', v.patientQueryRules, validate, ctrl.listPlans)
router.post('/plans', clinicalWrite, v.createPlanRules, validate, ctrl.createPlan)
router.get('/plans/:id', v.idRules, validate, ctrl.getPlan)
router.put('/plans/:id', clinicalWrite, v.updatePlanRules, validate, ctrl.updatePlan)
router.post('/plans/:id/approve', clinicalWrite, v.idRules, validate, ctrl.approvePlan)
router.delete('/plans/:id', clinicalWrite, v.idRules, validate, ctrl.deletePlan)
router.put('/plans/items/:itemId', clinicalWrite, v.planItemStatusRules, validate, ctrl.updatePlanItem)

router.get('/', v.patientQueryRules, validate, ctrl.listTreatments)
router.post('/', clinicalWrite, v.createTreatmentRules, validate, ctrl.createTreatment)
router.put('/:id', clinicalWrite, v.updateTreatmentRules, validate, ctrl.updateTreatment)
router.delete('/:id', clinicalWrite, v.idRules, validate, ctrl.deleteTreatment)

export default router