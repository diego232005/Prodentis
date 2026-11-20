import { apiClient } from '@/lib/api/client'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { useSessionStore } from '@/app/store/useSessionStore'
import { startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns'

export interface DashboardSummary {
  role?: string
  appointmentsToday: number
  patientsSeenToday: number
  waitingNow?: number
  noShowToday?: number
  pendingInvoices: number
  treatmentsInProgress: number
  lowStockItems: number
  expiringItems?: number
  monthIncome?: number
  noShowRate?: number
  myAppointmentsToday?: number
  pendingConfirmations?: number
  topTreatments?: { name: string; count: number }[]
  productivity?: { name: string; completed: number }[]
  cashToday?: { method: string; total: number }[]
  waitingRoom?: { id: string; patientName: string; dentistName: string; waitMinutes: number }[]
  todayAgenda?: {
    id: string
    patientName: string
    dentistName: string
    startAt: string
    status: string
    reason: string
  }[]
  upcomingAppointments: { id: string; startAt: string; patientName: string; dentistName: string }[]
}

export async function getDashboardSummary(_dentistId?: string): Promise<DashboardSummary> {
  const user = useSessionStore.getState().user
  try {
    const data = await apiClient.get<DashboardSummary>(
      `/dashboard?role=${user?.role ?? 'admin'}&userId=${user?.id ?? ''}`,
    )
    return {
      ...data,
      pendingInvoices: data.pendingInvoices ?? 0,
      upcomingAppointments:
        data.upcomingAppointments ??
        (data.todayAgenda ?? []).slice(0, 6).map((a) => ({
          id: a.id,
          startAt: a.startAt,
          patientName: a.patientName,
          dentistName: a.dentistName,
        })),
    }
  } catch {
    return localFallback(_dentistId)
  }
}

function localFallback(dentistId?: string): DashboardSummary {
  const s = useAppDataStore.getState()
  const today = new Date()
  const interval = { start: startOfDay(today), end: endOfDay(today) }
  const todayApts = s.appointments.filter((a) => isWithinInterval(parseISO(a.startAt), interval))
  const active = todayApts.filter((a) => a.status !== 'cancelled' && a.status !== 'no_show')
  const scoped = dentistId ? active.filter((a) => a.dentistId === dentistId) : active
  const upcoming = [...scoped]
    .filter((a) => !['cancelled', 'completed', 'no_show'].includes(a.status))
    .sort((a, b) => parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime())
    .slice(0, 6)
    .map((a) => {
      const p = s.patients.find((x) => x.id === a.patientId)
      const d = s.dentists.find((x) => x.id === a.dentistId)
      return {
        id: a.id,
        startAt: a.startAt,
        patientName: p ? `${p.firstName} ${p.lastName}` : 'Paciente',
        dentistName: d?.name ?? 'Odontólogo',
      }
    })
  return {
    appointmentsToday: scoped.length,
    patientsSeenToday: scoped.filter((a) => a.status === 'completed' || a.status === 'in_progress').length,
    waitingNow: scoped.filter((a) => a.status === 'waiting').length,
    pendingInvoices: s.invoices.filter((i) => i.status === 'pending' || i.status === 'partial').length,
    treatmentsInProgress: s.treatments.filter((t) => t.status === 'in_progress').length,
    lowStockItems: s.inventory.filter((i) => i.stock <= i.minStock).length,
    upcomingAppointments: upcoming,
  }
}
