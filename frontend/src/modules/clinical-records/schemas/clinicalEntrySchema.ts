import { z } from 'zod'

export const clinicalEntrySchema = z.object({
  type: z.enum(['evolution', 'diagnosis', 'procedure', 'note', 'attachment']),
  title: z.string().min(1, 'Título requerido'),
  content: z.string().min(1, 'Contenido requerido'),
  diagnosisCode: z.string().optional(),
  procedureId: z.string().optional(),
})

export type ClinicalEntryFormValues = z.infer<typeof clinicalEntrySchema>
