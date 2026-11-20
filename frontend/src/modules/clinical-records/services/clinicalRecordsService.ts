import { apiClient } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import type {
  ClinicalEntry,
  Consent,
  ConsentTemplate,
  DiagnosticFile,
  Medication,
  OdontogramSnapshot,
  OdontogramState,
  PeriodontogramEntry,
  Prescription,
  TreatmentPlan,
  ToothState,
} from '@/types/domain'

export async function listEntriesByPatient(patientId: string): Promise<ClinicalEntry[]> {
  const rows = await apiClient.get<ClinicalEntry[]>(`/clinical/entries?patientId=${patientId}`)
  return [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function addEntry(input: Omit<ClinicalEntry, 'id' | 'createdAt'>): Promise<ClinicalEntry> {
  const entry = await apiClient.post<ClinicalEntry>('/clinical/entries', input)
  useAppDataStore.getState().addClinicalEntry(entry)
  return entry
}

export async function getOdontogram(patientId: string): Promise<OdontogramState> {
  try {
    const o = await apiClient.get<OdontogramState>(`/clinical/odontograms/${patientId}`)
    useAppDataStore.getState().upsertOdontogram(o)
    return o
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return { patientId, teeth: defaultAdultTeeth(), updatedAt: new Date().toISOString() }
    }
    throw e
  }
}

export async function saveOdontogram(state: OdontogramState): Promise<OdontogramState> {
  const next = await apiClient.put<OdontogramState>(`/clinical/odontograms/${state.patientId}`, {
    teeth: state.teeth,
  })
  useAppDataStore.getState().upsertOdontogram(next)
  return next
}

export async function listOdontogramSnapshots(patientId: string): Promise<OdontogramSnapshot[]> {
  return apiClient.get<OdontogramSnapshot[]>(`/clinical/odontograms/${patientId}/snapshots`)
}

export async function createOdontogramSnapshot(
  state: OdontogramState,
  note = 'Snapshot clínico',
  _dentistId?: string,
): Promise<OdontogramSnapshot> {
  return apiClient.post<OdontogramSnapshot>(`/clinical/odontograms/${state.patientId}/snapshots`, {
    teeth: state.teeth,
    note: typeof note === 'string' ? note : 'Snapshot clínico',
  })
}

export async function listPeriodontogram(patientId: string): Promise<PeriodontogramEntry[]> {
  return apiClient.get<PeriodontogramEntry[]>(`/clinical/periodontograms?patientId=${patientId}`)
}

export async function addPeriodontogramEntry(
  input: Omit<PeriodontogramEntry, 'id' | 'recordedAt'>,
): Promise<PeriodontogramEntry> {
  return apiClient.post<PeriodontogramEntry>('/clinical/periodontograms', input)
}

export async function savePeriodontogram(
  patientId: string,
  payload: { toothId: string; probingDepth: number; bleeding: boolean; mobility: number; plaque: boolean },
) {
  return apiClient.post<PeriodontogramEntry>('/clinical/periodontograms', { patientId, ...payload })
}

export async function listMedications(): Promise<Medication[]> {
  const rows = await apiClient.get<Medication[]>('/clinical/medications')
  useAppDataStore.setState({ medications: rows })
  return rows
}

export async function listPrescriptions(patientId: string): Promise<Prescription[]> {
  return apiClient.get<Prescription[]>(`/clinical/prescriptions?patientId=${patientId}`)
}

export async function createPrescription(input: Omit<Prescription, 'id' | 'createdAt'>): Promise<Prescription> {
  return apiClient.post<Prescription>('/clinical/prescriptions', input)
}

export async function listDiagnosticFiles(patientId: string): Promise<DiagnosticFile[]> {
  return apiClient.get<DiagnosticFile[]>(`/clinical/diagnostics?patientId=${patientId}`)
}

export async function listDiagnostics(patientId: string) {
  return listDiagnosticFiles(patientId)
}

export async function getDiagnostic(id: string) {
  return apiClient.get<DiagnosticFile>(`/clinical/diagnostics/${id}`)
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

export async function uploadDiagnosticFile(
  patientId: string,
  file: File,
  extra: { toothId?: string; notes?: string; title?: string; fileType?: string } = {},
): Promise<DiagnosticFile> {
  const imageData = await readAsDataUrl(file)
  return apiClient.post<DiagnosticFile>('/clinical/diagnostics', {
    patientId,
    toothId: extra.toothId,
    fileType: extra.fileType ?? (file.name.toLowerCase().includes('pano') ? 'panoramic' : 'intraoral'),
    title: extra.title ?? file.name,
    takenAt: new Date().toISOString().slice(0, 10),
    notes: extra.notes ?? '',
    imageData,
    mimeType: file.type || 'image/jpeg',
  })
}

export async function updateDiagnosticNotes(id: string, notes: string) {
  return apiClient.put<DiagnosticFile>(`/clinical/diagnostics/${id}`, { notes }).catch(async () => {
    // fallback if only DELETE exists on some builds
    return { id, notes } as DiagnosticFile
  })
}

export async function listTreatmentPlans(patientId: string): Promise<TreatmentPlan[]> {
  return apiClient.get<TreatmentPlan[]>(`/treatments/plans?patientId=${patientId}`)
}

export async function listConsentTemplates(): Promise<ConsentTemplate[]> {
  const rows = await apiClient.get<ConsentTemplate[]>('/consents/templates')
  useAppDataStore.setState({ consentTemplates: rows })
  return rows
}

export async function listConsents(patientId: string): Promise<Consent[]> {
  return apiClient.get<Consent[]>(`/consents?patientId=${patientId}`)
}

export async function createConsent(input: {
  patientId: string
  templateId: string
  title?: string
  body?: string
  procedureName?: string
  signatureData?: string
  signatureDataUrl?: string
  signedByName?: string
  witnessName?: string
  signedAt?: string
  dentistId?: string
}): Promise<Consent> {
  return apiClient.post<Consent>('/consents', {
    ...input,
    procedureName: input.procedureName ?? input.title,
    signatureData: input.signatureData ?? input.signatureDataUrl,
  })
}

/** Compat: adjuntos = diagnósticos + consentimientos */
export async function listAttachments(patientId: string) {
  const [diags, consents] = await Promise.all([
    listDiagnosticFiles(patientId).catch(() => []),
    listConsents(patientId).catch(() => []),
  ])
  return [
    ...diags.map((d) => ({
      id: d.id,
      name: d.title || d.name || 'Archivo',
      uploadedAt: d.createdAt || d.uploadedAt || '',
    })),
    ...consents.map((c) => ({
      id: c.id,
      name: `Consentimiento ${c.procedureName || c.title}`,
      uploadedAt: c.signedAt || c.createdAt,
    })),
  ]
}

function defaultAdultTeeth(): ToothState[] {
  return [
    '18', '17', '16', '15', '14', '13', '12', '11',
    '21', '22', '23', '24', '25', '26', '27', '28',
    '48', '47', '46', '45', '44', '43', '42', '41',
    '31', '32', '33', '34', '35', '36', '37', '38',
  ].map((toothId) => ({ toothId, status: 'healthy' as const }))
}
