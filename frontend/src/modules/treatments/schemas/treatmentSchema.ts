import { z } from 'zod'

export const treatmentSchema = z.object({
  patientId: z.string().min(1, 'Paciente requerido'),
  dentistId: z.string().min(1, 'Odontólogo requerido'),
  procedureId: z.string().min(1, 'Procedimiento requerido'),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
  startDate: z.string().min(1, 'Fecha de inicio'),
  sessionsPlanned: z.number().min(1, 'Al menos 1 sesión'),
  sessionsDone: z.number().min(0),
  cost: z.number().min(0),
  notes: z.string(),
})

export type TreatmentFormValues = z.infer<typeof treatmentSchema>
