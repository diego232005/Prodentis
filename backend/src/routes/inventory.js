import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import {
  createInventoryRules,
  inventoryIdParam,
  movementRules,
  updateInventoryRules,
} from '../validators/inventoryValidator.js'
import { inventoryWrite } from '../middleware/rbac.js'
import * as ctrl from '../controllers/inventoryController.js'

const router = Router()

router.get('/movements', ctrl.listMovements)
router.get('/', ctrl.listInventory)
router.get('/:id', inventoryIdParam, validate, ctrl.getInventoryItem)
router.post('/', inventoryWrite, createInventoryRules, validate, ctrl.createInventoryItem)
router.put('/:id', inventoryWrite, updateInventoryRules, validate, ctrl.updateInventoryItem)
router.delete('/:id', inventoryWrite, inventoryIdParam, validate, ctrl.deleteInventoryItem)
router.post('/:id/movements', inventoryWrite, movementRules, validate, ctrl.recordMovement)

export default router
