import { apiClient } from '@/lib/api/client'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import type { Patient } from '@/types/domain'

export async function listPatients(): Promise<Patient[]> {
  const patients = await apiClient.get<Patient[]>('/patients')
  useAppDataStore.setState({ patients })
  return patients
}

export async function getPatient(id: string): Promise<Patient> {
  return apiClient.get<Patient>(`/patients/${id}`)
}

export async function createPatient(input: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
  const patient = await apiClient.post<Patient>('/patients', input)
  useAppDataStore.getState().upsertPatient(patient)
  return patient
}

export async function updatePatient(patient: Patient): Promise<Patient> {
  const next = await apiClient.put<Patient>(`/patients/${patient.id}`, patient)
  useAppDataStore.getState().upsertPatient(next)
  return next
}

export async function deletePatient(id: string): Promise<void> {
  await apiClient.delete(`/patients/${id}`)
  useAppDataStore.getState().deletePatient(id)
}
