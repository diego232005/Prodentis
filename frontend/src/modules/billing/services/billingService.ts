import { apiClient } from '@/lib/api/client'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import type { CashClosure, Invoice, InvoiceLine, Payment, TreatmentPlan } from '@/types/domain'
import type { InvoiceStatus } from '@/types/common'

export interface CashSummary {
  date: string
  totalCash?: number
  totalCard?: number
  totalTransfer?: number
  cash?: number
  card?: number
  transfer?: number
  total: number
  paymentsCount: number
  closure?: CashClosure | null
}

function syncInvoice(inv: Invoice) {
  useAppDataStore.getState().upsertInvoice(inv)
  return inv
}

export async function listInvoices(): Promise<Invoice[]> {
  const invoices = await apiClient.get<Invoice[]>('/billing/invoices')
  useAppDataStore.setState({ invoices })
  return [...invoices].sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
}

export async function getInvoice(id: string): Promise<Invoice> {
  return syncInvoice(await apiClient.get<Invoice>(`/billing/invoices/${id}`))
}

export async function createInvoice(
  input: {
    patientId: string
    dueAt: string
    notes: string
    lines: InvoiceLine[]
    tax?: number
    issuedAt?: string
  },
): Promise<Invoice> {
  return syncInvoice(await apiClient.post<Invoice>('/billing/invoices', input))
}

export async function updateInvoice(invoice: Invoice): Promise<Invoice> {
  useAppDataStore.getState().upsertInvoice(invoice)
  return invoice
}

export async function setInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
  if (status === 'void') {
    return syncInvoice(await apiClient.post<Invoice>(`/billing/invoices/${id}/void`, {}))
  }
  const cur = await getInvoice(id)
  const next = { ...cur, status }
  useAppDataStore.getState().upsertInvoice(next)
  return next
}

export async function listPayments(invoiceId?: string): Promise<Payment[]> {
  const q = invoiceId ? `?invoiceId=${invoiceId}` : ''
  const rows = await apiClient.get<Payment[]>(`/billing/payments${q}`)
  if (invoiceId) {
    useAppDataStore.setState((s) => ({
      payments: [...s.payments.filter((p) => p.invoiceId !== invoiceId), ...rows],
    }))
  }
  return rows
}

export async function registerPayment(
  input: Omit<Payment, 'id'>,
): Promise<{ payment: Payment; invoice: Invoice }> {
  const res = await apiClient.post<{ payment: Payment; invoice: Invoice }>(
    `/billing/invoices/${input.invoiceId}/payments`,
    input,
  )
  useAppDataStore.getState().addPayment(res.payment)
  syncInvoice(res.invoice)
  return res
}

export async function getCashSummary(date: string): Promise<CashSummary> {
  return apiClient.get<CashSummary>(`/billing/cash-summary?date=${encodeURIComponent(date)}`)
}

export async function listCashClosures(): Promise<CashClosure[]> {
  const rows = await apiClient.get<CashClosure[]>('/billing/cash-closures')
  useAppDataStore.setState({ cashClosures: rows })
  return rows
}

export async function closeCash(input: string | { date?: string; notes?: string } = '') {
  const body = typeof input === 'string' ? { notes: input } : input
  return apiClient.post<CashClosure>('/billing/cash-closures', body)
}

export async function listTreatmentPlans(patientId?: string): Promise<TreatmentPlan[]> {
  const q = patientId ? `?patientId=${patientId}` : ''
  return apiClient.get<TreatmentPlan[]>(`/treatments/plans${q}`)
}

export async function createTreatmentPlan(body: {
  patientId: string
  dentistId: string
  title: string
  status?: string
  discountPercent?: number
  notes?: string
  items: { procedureId?: string; toothId?: string; description: string; unitCost: number; quantity: number }[]
}) {
  return apiClient.post<TreatmentPlan>('/treatments/plans', body)
}
