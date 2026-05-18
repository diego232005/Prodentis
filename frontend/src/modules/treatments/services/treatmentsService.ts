import { mockDelay, MockApiError } from '@/lib/api/delay'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { createId } from '@/lib/utils/id'
import type { ProcedureCatalogItem, Treatment } from '@/types/domain'
import type { TreatmentStatus } from '@/types/common'

export async function listProcedures(): Promise<ProcedureCatalogItem[]> {
  await mockDelay(100)
  return [...useAppDataStore.getState().procedures]
}

export async function listTreatments(): Promise<Treatment[]> {
  await mockDelay()
  return [...useAppDataStore.getState().treatments].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export async function getTreatment(id: string): Promise<Treatment> {
  await mockDelay(200)
  const t = useAppDataStore.getState().treatments.find((x) => x.id === id)
  if (!t) throw new MockApiError('Tratamiento no encontrado', 404)
  return t
}

export async function createTreatment(
  input: Omit<Treatment, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Treatment> {
  await mockDelay()
  const now = new Date().toISOString()
  const t: Treatment = { ...input, id: createId('t'), createdAt: now, updatedAt: now }
  useAppDataStore.getState().upsertTreatment(t)
  return t
}

export async function updateTreatment(treatment: Treatment): Promise<Treatment> {
  await mockDelay()
  const next = { ...treatment, updatedAt: new Date().toISOString() }
  useAppDataStore.getState().upsertTreatment(next)
  return next
}

export async function setTreatmentStatus(id: string, status: TreatmentStatus): Promise<Treatment> {
  await mockDelay()
  const store = useAppDataStore.getState()
  const cur = store.treatments.find((x) => x.id === id)
  if (!cur) throw new MockApiError('Tratamiento no encontrado', 404)
  const next: Treatment = {
    ...cur,
    status,
    updatedAt: new Date().toISOString(),
    endDate: status === 'completed' ? new Date().toISOString() : cur.endDate,
    sessionsDone: status === 'completed' ? cur.sessionsPlanned : cur.sessionsDone,
  }
  store.upsertTreatment(next)
  return next
}

export async function registerProgress(id: string, sessionsDone: number): Promise<Treatment> {
  await mockDelay()
  const store = useAppDataStore.getState()
  const cur = store.treatments.find((x) => x.id === id)
  if (!cur) throw new MockApiError('Tratamiento no encontrado', 404)
  const next: Treatment = {
    ...cur,
    sessionsDone: Math.min(sessionsDone, cur.sessionsPlanned),
    status: sessionsDone >= cur.sessionsPlanned ? 'completed' : 'in_progress',
    updatedAt: new Date().toISOString(),
  }
  store.upsertTreatment(next)
  return next
}
