import { z } from 'zod'

export const patientSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  documentId: z.string().min(1, 'Documento requerido'),
  birthDate: z.string().min(1, 'Fecha de nacimiento requerida'),
  phone: z.string().min(1, 'Teléfono requerido'),
  email: z.string().email('Correo inválido'),
  address: z.string().min(1, 'Dirección requerida'),
  status: z.enum(['active', 'inactive', 'archived']),
  allergies: z.string(),
  medicalNotes: z.string(),
})

export type PatientFormValues = z.infer<typeof patientSchema>
