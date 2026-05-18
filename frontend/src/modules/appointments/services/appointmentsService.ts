import { apiClient } from '@/lib/api/client'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import type { Appointment } from '@/types/domain'
import type { AppointmentStatus } from '@/types/common'

export async function listAppointments(): Promise<Appointment[]> {
  const appointments = await apiClient.get<Appointment[]>('/appointments')
  useAppDataStore.setState({ appointments })
  return appointments
}

export async function getAppointment(id: string): Promise<Appointment> {
  return apiClient.get<Appointment>(`/appointments/${id}`)
}

export async function createAppointment(
  input: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Appointment> {
  const a = await apiClient.post<Appointment>('/appointments', input)
  useAppDataStore.getState().upsertAppointment(a)
  return a
}

export async function updateAppointment(apt: Appointment): Promise<Appointment> {
  const next = await apiClient.put<Appointment>(`/appointments/${apt.id}`, apt)
  useAppDataStore.getState().upsertAppointment(next)
  return next
}

export async function cancelAppointment(id: string): Promise<void> {
  await setAppointmentStatus(id, 'cancelled')
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
  const cur = useAppDataStore.getState().appointments.find((x) => x.id === id)
  if (!cur) return apiClient.put<Appointment>(`/appointments/${id}`, { status })
  const next = await apiClient.put<Appointment>(`/appointments/${id}`, { ...cur, status })
  useAppDataStore.getState().upsertAppointment(next)
  return next
}

export async function deleteAppointment(id: string): Promise<void> {
  await apiClient.delete(`/appointments/${id}`)
  useAppDataStore.getState().deleteAppointment(id)
}
