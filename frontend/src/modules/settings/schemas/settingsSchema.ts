import { z } from 'zod'

export const clinicSettingsSchema = z.object({
  name: z.string().min(1, 'Nombre del consultorio'),
  taxId: z.string().min(1, 'CUIT / identificación fiscal'),
  phone: z.string().min(1, 'Teléfono'),
  email: z.string().email('Correo inválido'),
  address: z.string().min(1, 'Dirección'),
  openingHours: z.string().min(1, 'Horarios'),
})

export type ClinicSettingsFormValues = z.infer<typeof clinicSettingsSchema>

export const userSettingsSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Correo inválido'),
})

export type UserSettingsFormValues = z.infer<typeof userSettingsSchema>
