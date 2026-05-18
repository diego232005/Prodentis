import { z } from 'zod'

export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Seleccione paciente'),
  dentistId: z.string().min(1, 'Seleccione odontólogo'),
  startAt: z.string().min(1, 'Fecha y hora de inicio'),
  endAt: z.string().min(1, 'Fecha y hora de fin'),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']),
  reason: z.string().min(1, 'Motivo requerido'),
  notes: z.string(),
})

export type AppointmentFormValues = z.infer<typeof appointmentSchema>
