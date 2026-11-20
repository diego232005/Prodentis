import { z } from 'zod'

export const clinicalEntrySchema = z
  .object({
    type: z.enum(['evolution', 'diagnosis', 'procedure', 'note', 'attachment']),
    title: z.string().min(1, 'Título requerido'),
    content: z.string(),
    diagnosisCode: z.string(),
    procedureId: z.string(),
    // Consulta
    chiefComplaint: z.string(),
    currentIllness: z.string(),
    physicalExam: z.string(),
    diagnosis: z.string(),
    treatmentPerformed: z.string(),
    indications: z.string(),
    nextVisit: z.string(),
    toothId: z.string(),
  })
  .refine(
    (v) => [v.content, v.chiefComplaint, v.diagnosis, v.treatmentPerformed].some((s) => s.trim().length > 0),
    { path: ['content'], message: 'Complete al menos motivo, diagnóstico, tratamiento o notas' },
  )

export type ClinicalEntryFormValues = z.infer<typeof clinicalEntrySchema>

export const CLINICAL_ENTRY_DEFAULTS: ClinicalEntryFormValues = {
  type: 'evolution',
  title: '',
  content: '',
  diagnosisCode: '',
  procedureId: '',
  chiefComplaint: '',
  currentIllness: '',
  physicalExam: '',
  diagnosis: '',
  treatmentPerformed: '',
  indications: '',
  nextVisit: '',
  toothId: '',
}

// --- Receta y consentimiento ---
export const prescriptionItemSchema = z.object({
  name: z.string().min(1, 'Medicamento requerido'),
  dose: z.string(),
  frequency: z.string(),
  duration: z.string(),
  notes: z.string().optional(),
})

export const consentFormSchema = z.object({
  templateId: z.string().min(1, 'Seleccione plantilla'),
  signedByName: z.string().min(1, 'Nombre del firmante requerido'),
})

export type ConsentFormValues = z.infer<typeof consentFormSchema>
