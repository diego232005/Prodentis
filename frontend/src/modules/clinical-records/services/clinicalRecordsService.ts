import { mockDelay } from '@/lib/api/delay'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { createId } from '@/lib/utils/id'
import type { ClinicalEntry, OdontogramState, ToothState } from '@/types/domain'

export async function listEntriesByPatient(patientId: string): Promise<ClinicalEntry[]> {
  await mockDelay()
  return useAppDataStore
    .getState()
    .clinicalEntries.filter((e) => e.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function addEntry(
  input: Omit<ClinicalEntry, 'id' | 'createdAt'>,
): Promise<ClinicalEntry> {
  await mockDelay()
  const entry: ClinicalEntry = {
    ...input,
    id: createId('cl'),
    createdAt: new Date().toISOString(),
  }
  useAppDataStore.getState().addClinicalEntry(entry)
  return entry
}

export async function getOdontogram(patientId: string): Promise<OdontogramState> {
  await mockDelay(200)
  const existing = useAppDataStore.getState().odontograms.find((o) => o.patientId === patientId)
  if (existing) return existing
  const teeth: ToothState[] = [
    '18', '17', '16', '15', '14', '13', '12', '11',
    '21', '22', '23', '24', '25', '26', '27', '28',
    '48', '47', '46', '45', '44', '43', '42', '41',
    '31', '32', '33', '34', '35', '36', '37', '38',
  ].map((toothId) => ({ toothId, status: 'healthy' as const }))
  const o: OdontogramState = { patientId, teeth, updatedAt: new Date().toISOString() }
  useAppDataStore.getState().upsertOdontogram(o)
  return o
}

export async function saveOdontogram(state: OdontogramState): Promise<OdontogramState> {
  await mockDelay()
  const next = { ...state, updatedAt: new Date().toISOString() }
  useAppDataStore.getState().upsertOdontogram(next)
  return next
}

export async function listAttachments(_patientId: string): Promise<{ id: string; name: string; uploadedAt: string }[]> {
  await mockDelay(200)
  return [
    { id: 'att1', name: 'Radiografía panorámica.pdf', uploadedAt: new Date().toISOString() },
    { id: 'att2', name: 'Consentimiento informado.pdf', uploadedAt: new Date().toISOString() },
  ]
}
