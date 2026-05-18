import { z } from 'zod'

export const inventoryItemSchema = z.object({
  sku: z.string().min(1, 'SKU requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  category: z.string().min(1, 'Categoría'),
  unit: z.string().min(1, 'Unidad'),
  stock: z.number().min(0),
  minStock: z.number().min(0),
  unitCost: z.number().min(0),
  supplier: z.string().min(1, 'Proveedor'),
})

export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>

export const stockMovementSchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(['in', 'out']),
  quantity: z.number().min(1),
  reason: z.string().min(1, 'Motivo requerido'),
})

export type StockMovementFormValues = z.infer<typeof stockMovementSchema>
