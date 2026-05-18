import { body, param } from 'express-validator'

export const inventoryIdParam = [param('id').isString().notEmpty()]

export const createInventoryRules = [
  body('sku').trim().isLength({ min: 2, max: 64 }),
  body('name').trim().isLength({ min: 2, max: 255 }),
  body('category').trim().notEmpty(),
  body('unit').trim().notEmpty(),
  body('stock').isInt({ min: 0 }),
  body('minStock').isInt({ min: 0 }),
  body('unitCost').isFloat({ min: 0 }),
  body('supplier').optional().isString(),
]

export const updateInventoryRules = [
  ...inventoryIdParam,
  body('sku').optional().trim().isLength({ min: 2, max: 64 }),
  body('name').optional().trim().isLength({ min: 2, max: 255 }),
  body('category').optional().trim().notEmpty(),
  body('unit').optional().trim().notEmpty(),
  body('stock').optional().isInt({ min: 0 }),
  body('minStock').optional().isInt({ min: 0 }),
  body('unitCost').optional().isFloat({ min: 0 }),
  body('supplier').optional().isString(),
]

export const movementRules = [
  ...inventoryIdParam,
  body('type').isIn(['in', 'out']),
  body('quantity').isInt({ min: 1 }),
  body('reason').trim().notEmpty(),
  body('relatedTreatmentId').optional().isString(),
]
