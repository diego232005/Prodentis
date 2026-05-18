import { create } from 'zustand'
import {
  cloneSeed,
  SEED_APPOINTMENTS,
  SEED_CLINIC,
  SEED_CLINICAL,
  SEED_DENTISTS,
  SEED_INVENTORY,
  SEED_INVOICES,
  SEED_MOVEMENTS,
  SEED_ODONTOGRAMS,
  SEED_PATIENTS,
  SEED_PAYMENTS,
  SEED_PROCEDURES,
  SEED_STAFF_ACCOUNTS,
  SEED_TREATMENTS,
  SEED_USERS,
} from '@/data/seed'
import type {
  Appointment,
  ClinicalEntry,
  InventoryItem,
  Invoice,
  MockUserAccount,
  OdontogramState,
  Patient,
  Payment,
  StockMovement,
  Treatment,
} from '@/types/domain'
import type { ClinicSettings } from '@/types/domain'
import type { AppointmentStatus, InvoiceStatus, TreatmentStatus } from '@/types/common'

interface AppDataState {
  users: typeof SEED_USERS
  dentists: typeof SEED_DENTISTS
  patients: Patient[]
  procedures: typeof SEED_PROCEDURES
  appointments: Appointment[]
  treatments: Treatment[]
  clinicalEntries: ClinicalEntry[]
  odontograms: OdontogramState[]
  invoices: Invoice[]
  payments: Payment[]
  inventory: InventoryItem[]
  movements: StockMovement[]
  clinic: ClinicSettings
  staffAccounts: MockUserAccount[]
  reset: () => void
  upsertPatient: (p: Patient) => void
  deletePatient: (id: string) => void
  upsertAppointment: (a: Appointment) => void
  deleteAppointment: (id: string) => void
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void
  upsertTreatment: (t: Treatment) => void
  setTreatmentStatus: (id: string, status: TreatmentStatus) => void
  addClinicalEntry: (e: ClinicalEntry) => void
  upsertOdontogram: (o: OdontogramState) => void
  upsertInvoice: (inv: Invoice) => void
  setInvoiceStatus: (id: string, status: InvoiceStatus) => void
  addPayment: (p: Payment) => void
  upsertInventoryItem: (i: InventoryItem) => void
  addStockMovement: (m: StockMovement) => void
  adjustStock: (itemId: string, delta: number) => void
  updateClinic: (c: Partial<ClinicSettings>) => void
  upsertStaffAccount: (a: MockUserAccount) => void
}

const initial = () => ({
  users: cloneSeed(SEED_USERS),
  dentists: cloneSeed(SEED_DENTISTS),
  patients: cloneSeed(SEED_PATIENTS),
  procedures: cloneSeed(SEED_PROCEDURES),
  appointments: cloneSeed(SEED_APPOINTMENTS),
  treatments: cloneSeed(SEED_TREATMENTS),
  clinicalEntries: cloneSeed(SEED_CLINICAL),
  odontograms: cloneSeed(SEED_ODONTOGRAMS),
  invoices: cloneSeed(SEED_INVOICES),
  payments: cloneSeed(SEED_PAYMENTS),
  inventory: cloneSeed(SEED_INVENTORY),
  movements: cloneSeed(SEED_MOVEMENTS),
  clinic: cloneSeed(SEED_CLINIC),
  staffAccounts: cloneSeed(SEED_STAFF_ACCOUNTS),
})

export const useAppDataStore = create<AppDataState>((set) => ({
  ...initial(),
  reset: () => set(initial()),
  upsertPatient: (p) =>
    set((s) => {
      const idx = s.patients.findIndex((x) => x.id === p.id)
      const patients = idx >= 0 ? s.patients.map((x) => (x.id === p.id ? p : x)) : [...s.patients, p]
      return { patients }
    }),
  deletePatient: (id) => set((s) => ({ patients: s.patients.filter((x) => x.id !== id) })),
  upsertAppointment: (a) =>
    set((s) => {
      const idx = s.appointments.findIndex((x) => x.id === a.id)
      const appointments = idx >= 0 ? s.appointments.map((x) => (x.id === a.id ? a : x)) : [...s.appointments, a]
      return { appointments }
    }),
  deleteAppointment: (id) => set((s) => ({ appointments: s.appointments.filter((x) => x.id !== id) })),
  setAppointmentStatus: (id, status) =>
    set((s) => ({
      appointments: s.appointments.map((x) => (x.id === id ? { ...x, status, updatedAt: new Date().toISOString() } : x)),
    })),
  upsertTreatment: (t) =>
    set((s) => {
      const idx = s.treatments.findIndex((x) => x.id === t.id)
      const treatments = idx >= 0 ? s.treatments.map((x) => (x.id === t.id ? t : x)) : [...s.treatments, t]
      return { treatments }
    }),
  setTreatmentStatus: (id, status) =>
    set((s) => ({
      treatments: s.treatments.map((x) =>
        x.id === id ? { ...x, status, updatedAt: new Date().toISOString(), endDate: status === 'completed' ? new Date().toISOString() : x.endDate } : x,
      ),
    })),
  addClinicalEntry: (e) => set((s) => ({ clinicalEntries: [e, ...s.clinicalEntries] })),
  upsertOdontogram: (o) =>
    set((s) => {
      const idx = s.odontograms.findIndex((x) => x.patientId === o.patientId)
      const odontograms =
        idx >= 0 ? s.odontograms.map((x) => (x.patientId === o.patientId ? o : x)) : [...s.odontograms, o]
      return { odontograms }
    }),
  upsertInvoice: (inv) =>
    set((s) => {
      const idx = s.invoices.findIndex((x) => x.id === inv.id)
      const invoices = idx >= 0 ? s.invoices.map((x) => (x.id === inv.id ? inv : x)) : [...s.invoices, inv]
      return { invoices }
    }),
  setInvoiceStatus: (id, status) =>
    set((s) => ({
      invoices: s.invoices.map((x) => (x.id === id ? { ...x, status, updatedAt: new Date().toISOString() } : x)),
    })),
  addPayment: (p) =>
    set((s) => {
      const inv = s.invoices.find((i) => i.id === p.invoiceId)
      if (!inv) return { payments: [...s.payments, p] }
      const amountPaid = inv.amountPaid + p.amount
      let status: InvoiceStatus = inv.status
      if (amountPaid >= inv.total) status = 'paid'
      else if (amountPaid > 0) status = 'partial'
      const invoices = s.invoices.map((i) =>
        i.id === inv.id ? { ...i, amountPaid, status, updatedAt: new Date().toISOString() } : i,
      )
      return { payments: [...s.payments, p], invoices }
    }),
  upsertInventoryItem: (i) =>
    set((s) => {
      const idx = s.inventory.findIndex((x) => x.id === i.id)
      const inventory = idx >= 0 ? s.inventory.map((x) => (x.id === i.id ? i : x)) : [...s.inventory, i]
      return { inventory }
    }),
  addStockMovement: (m) => set((s) => ({ movements: [m, ...s.movements] })),
  adjustStock: (itemId, delta) =>
    set((s) => ({
      inventory: s.inventory.map((i) =>
        i.id === itemId
          ? { ...i, stock: Math.max(0, i.stock + delta), updatedAt: new Date().toISOString() }
          : i,
      ),
    })),
  updateClinic: (c) => set((s) => ({ clinic: { ...s.clinic, ...c } })),
  upsertStaffAccount: (a) =>
    set((s) => {
      const idx = s.staffAccounts.findIndex((x) => x.id === a.id)
      const staffAccounts =
        idx >= 0 ? s.staffAccounts.map((x) => (x.id === a.id ? a : x)) : [...s.staffAccounts, a]
      return { staffAccounts }
    }),
}))
