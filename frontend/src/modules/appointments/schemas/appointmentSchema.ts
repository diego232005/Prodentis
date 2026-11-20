import { z } from 'zod'

export const APPOINTMENT_STATUSES = [
  'pending',
  'confirmed',
  'waiting',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
] as const

export const appointmentSchema = z
  .object({
    patientId: z.string().min(1, 'Seleccione paciente'),
    dentistId: z.string().min(1, 'Seleccione odontólogo'),
    chairId: z.string(),
    procedureId: z.string(),
    startAt: z.string().min(1, 'Fecha y hora de inicio'),
    endAt: z.string().min(1, 'Fecha y hora de fin'),
    status: z.enum(APPOINTMENT_STATUSES),
    reason: z.string().min(1, 'Motivo requerido'),
    notes: z.string(),
  })
  .refine((v) => !v.startAt || !v.endAt || new Date(v.endAt) > new Date(v.startAt), {
    path: ['endAt'],
    message: 'El fin debe ser posterior al inicio',
  })

export type AppointmentFormValues = z.infer<typeof appointmentSchema>
