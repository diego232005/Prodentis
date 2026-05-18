import { mockDelay } from '@/lib/api/delay'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns'

export interface DashboardSummary {
  appointmentsToday: number
  patientsSeenToday: number
  pendingInvoices: number
  treatmentsInProgress: number
  lowStockItems: number
  upcomingAppointments: { id: string; startAt: string; patientName: string; dentistName: string }[]
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await mockDelay(350)
  const s = useAppDataStore.getState()
  const today = new Date()
  const interval = { start: startOfDay(today), end: endOfDay(today) }

  const todayApts = s.appointments.filter((a) =>
    isWithinInterval(parseISO(a.startAt), interval),
  )
  const appointmentsToday = todayApts.filter((a) => a.status !== 'cancelled').length
  const patientsSeenToday = new Set(
    todayApts.filter((a) => a.status === 'completed' || a.status === 'in_progress').map((a) => a.patientId),
  ).size

  const pendingInvoices = s.invoices.filter((i) => i.status === 'pending' || i.status === 'partial').length
  const treatmentsInProgress = s.treatments.filter((t) => t.status === 'in_progress').length
  const lowStockItems = s.inventory.filter((i) => i.stock <= i.minStock).length

  const upcoming = [...s.appointments]
    .filter((a) => parseISO(a.startAt) >= today && a.status !== 'cancelled' && a.status !== 'completed')
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
    appointmentsToday,
    patientsSeenToday,
    pendingInvoices,
    treatmentsInProgress,
    lowStockItems,
    upcomingAppointments: upcoming,
  }
}
