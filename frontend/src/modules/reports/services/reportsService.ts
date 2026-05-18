import { mockDelay } from '@/lib/api/delay'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import {
  eachMonthOfInterval,
  format,
  parseISO,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns'
import { es } from 'date-fns/locale'

export interface MonthlyPoint {
  label: string
  appointments: number
  revenue: number
  newPatients: number
  clinicalEntries: number
}

export interface ReportChartsData {
  summary: {
    totalPatients: number
    activePatients: number
    totalAppointments: number
    completedAppointments: number
    totalTreatments: number
    totalInvoices: number
    totalRevenue: number
    inventoryItems: number
    lowStockItems: number
  }
  appointmentsByMonth: MonthlyPoint[]
  appointmentsByStatus: { status: string; count: number }[]
  topProcedures: { name: string; count: number }[]
  newPatientsByMonth: { label: string; count: number }[]
  dentistWorkload: { name: string; appointments: number }[]
  invoiceByStatus: { status: string; count: number; total: number }[]
  clinicalByMonth: { label: string; count: number }[]
  lowestStock: { name: string; stock: number; minStock: number; ratio: number }[]
  inventoryByCategory: { category: string; items: number; stockUnits: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  in_progress: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  paid: 'Pagada',
  partial: 'Pago parcial',
  void: 'Anulada',
  planned: 'Planificado',
  active: 'Activo',
  inactive: 'Inactivo',
}

export async function getReportCharts(): Promise<ReportChartsData> {
  await mockDelay(300)
  const s = useAppDataStore.getState()
  const end = new Date()
  const start = subMonths(end, 11)
  const months = eachMonthOfInterval({ start: startOfMonth(start), end: endOfMonth(end) })

  const appointmentsByMonth: MonthlyPoint[] = months.map((m) => {
    const interval = { start: startOfMonth(m), end: endOfMonth(m) }
    const apts = s.appointments.filter(
      (a) => isWithinInterval(parseISO(a.startAt), interval) && a.status !== 'cancelled',
    )
    const revenue = s.invoices
      .filter((i) => isWithinInterval(parseISO(i.issuedAt), interval) && i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0)
    const newPatients = s.patients.filter((p) =>
      isWithinInterval(parseISO(p.createdAt), interval),
    ).length
    const clinicalEntries = s.clinicalEntries.filter((c) =>
      isWithinInterval(parseISO(c.createdAt), interval),
    ).length
    return {
      label: format(m, 'MMM yy', { locale: es }),
      appointments: apts.length,
      revenue,
      newPatients,
      clinicalEntries,
    }
  })

  const statusCount = new Map<string, number>()
  for (const a of s.appointments) {
    statusCount.set(a.status, (statusCount.get(a.status) ?? 0) + 1)
  }
  const appointmentsByStatus = [...statusCount.entries()]
    .map(([status, count]) => ({ status: STATUS_LABELS[status] ?? status, count }))
    .sort((a, b) => b.count - a.count)

  const procCount = new Map<string, number>()
  for (const t of s.treatments) {
    const proc = s.procedures.find((p) => p.id === t.procedureId)
    const name = proc?.name ?? 'Otro'
    procCount.set(name, (procCount.get(name) ?? 0) + 1)
  }
  const topProcedures = [...procCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const newPatientsByMonth = appointmentsByMonth.map((m) => ({
    label: m.label,
    count: m.newPatients,
  }))

  const dentistCount = new Map<string, number>()
  for (const a of s.appointments.filter((x) => x.status !== 'cancelled')) {
    const d = s.dentists.find((dent) => dent.id === a.dentistId)
    const name = d?.name ?? a.dentistId
    dentistCount.set(name, (dentistCount.get(name) ?? 0) + 1)
  }
  const dentistWorkload = [...dentistCount.entries()]
    .map(([name, appointments]) => ({ name, appointments }))
    .sort((a, b) => b.appointments - a.appointments)

  const invStatus = new Map<string, { count: number; total: number }>()
  for (const inv of s.invoices) {
    const cur = invStatus.get(inv.status) ?? { count: 0, total: 0 }
    cur.count += 1
    cur.total += inv.total
    invStatus.set(inv.status, cur)
  }
  const invoiceByStatus = [...invStatus.entries()].map(([status, v]) => ({
    status: STATUS_LABELS[status] ?? status,
    count: v.count,
    total: v.total,
  }))

  const clinicalByMonth = appointmentsByMonth.map((m) => ({
    label: m.label,
    count: m.clinicalEntries,
  }))

  const lowestStock = [...s.inventory]
    .map((i) => ({
      name: i.name,
      stock: i.stock,
      minStock: i.minStock,
      ratio: i.stock / Math.max(i.minStock, 1),
    }))
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 8)

  const catMap = new Map<string, { items: number; stockUnits: number }>()
  for (const item of s.inventory) {
    const c = catMap.get(item.category) ?? { items: 0, stockUnits: 0 }
    c.items += 1
    c.stockUnits += item.stock
    catMap.set(item.category, c)
  }
  const inventoryByCategory = [...catMap.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.stockUnits - a.stockUnits)

  const totalRevenue = s.invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0)

  return {
    summary: {
      totalPatients: s.patients.length,
      activePatients: s.patients.filter((p) => p.status === 'active').length,
      totalAppointments: s.appointments.length,
      completedAppointments: s.appointments.filter((a) => a.status === 'completed').length,
      totalTreatments: s.treatments.length,
      totalInvoices: s.invoices.length,
      totalRevenue,
      inventoryItems: s.inventory.length,
      lowStockItems: s.inventory.filter((i) => i.stock <= i.minStock).length,
    },
    appointmentsByMonth,
    appointmentsByStatus,
    topProcedures,
    newPatientsByMonth,
    dentistWorkload,
    invoiceByStatus,
    clinicalByMonth,
    lowestStock,
    inventoryByCategory,
  }
}
