import { mockDelay, MockApiError } from '@/lib/api/delay'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { createId } from '@/lib/utils/id'
import type { Invoice, InvoiceLine, Payment } from '@/types/domain'
import type { InvoiceStatus } from '@/types/common'

function computeTotals(lines: InvoiceLine[], taxRate = 0.21) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const tax = Math.round(subtotal * taxRate)
  const total = subtotal + tax
  return { subtotal, tax, total }
}

export async function listInvoices(): Promise<Invoice[]> {
  await mockDelay()
  return [...useAppDataStore.getState().invoices].sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
  )
}

export async function getInvoice(id: string): Promise<Invoice> {
  await mockDelay(200)
  const inv = useAppDataStore.getState().invoices.find((x) => x.id === id)
  if (!inv) throw new MockApiError('Factura no encontrada', 404)
  return inv
}

export async function createInvoice(
  input: Omit<
    Invoice,
    'id' | 'createdAt' | 'updatedAt' | 'subtotal' | 'tax' | 'total' | 'amountPaid' | 'issuedAt' | 'status'
  > & {
    lines: InvoiceLine[]
    issuedAt?: string
  },
): Promise<Invoice> {
  await mockDelay()
  const { subtotal, tax, total } = computeTotals(input.lines)
  const now = new Date().toISOString()
  const inv: Invoice = {
    ...input,
    issuedAt: input.issuedAt ?? now,
    id: createId('inv'),
    subtotal,
    tax,
    total,
    amountPaid: 0,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
  useAppDataStore.getState().upsertInvoice(inv)
  return inv
}

export async function updateInvoice(invoice: Invoice): Promise<Invoice> {
  await mockDelay()
  const { subtotal, tax, total } = computeTotals(invoice.lines)
  const next = { ...invoice, subtotal, tax, total, updatedAt: new Date().toISOString() }
  useAppDataStore.getState().upsertInvoice(next)
  return next
}

export async function setInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
  await mockDelay()
  const store = useAppDataStore.getState()
  const cur = store.invoices.find((x) => x.id === id)
  if (!cur) throw new MockApiError('Factura no encontrada', 404)
  const next = { ...cur, status, updatedAt: new Date().toISOString() }
  store.upsertInvoice(next)
  return next
}

export async function registerPayment(input: Omit<Payment, 'id'>): Promise<Payment> {
  await mockDelay()
  const payment: Payment = { ...input, id: createId('pay') }
  useAppDataStore.getState().addPayment(payment)
  return payment
}
