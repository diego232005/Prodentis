import { z } from 'zod'

export const invoiceLineSchema = z.object({
  description: z.string().min(1, 'Descripción'),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  treatmentId: z.string().optional(),
})

export const invoiceCreateSchema = z.object({
  patientId: z.string().min(1, 'Paciente requerido'),
  dueAt: z.string().min(1, 'Vencimiento'),
  notes: z.string(),
  lines: z.array(invoiceLineSchema).min(1, 'Al menos un ítem'),
})

export type InvoiceCreateFormValues = z.infer<typeof invoiceCreateSchema>

export const paymentSchema = z.object({
  amount: z.number().min(1, 'Monto inválido'),
  method: z.enum(['cash', 'card', 'transfer']),
  reference: z.string(),
})

export type PaymentFormValues = z.infer<typeof paymentSchema>
