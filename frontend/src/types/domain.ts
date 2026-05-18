import type { AppointmentStatus, InvoiceStatus, PatientStatus, TreatmentStatus, UserRole } from '@/types/common'

export interface MockUser {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  avatarUrl?: string
}

export interface Dentist {
  id: string
  userId: string
  name: string
  specialty: string
  licenseNumber: string
}

export interface Patient {
  id: string
  firstName: string
  lastName: string
  documentId: string
  birthDate: string
  phone: string
  email: string
  address: string
  status: PatientStatus
  allergies: string
  medicalNotes: string
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: string
  patientId: string
  dentistId: string
  startAt: string
  endAt: string
  status: AppointmentStatus
  reason: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface ProcedureCatalogItem {
  id: string
  code: string
  name: string
  description: string
  basePrice: number
  durationMinutes: number
}

export interface Treatment {
  id: string
  patientId: string
  dentistId: string
  procedureId: string
  status: TreatmentStatus
  startDate: string
  endDate?: string
  sessionsPlanned: number
  sessionsDone: number
  cost: number
  notes: string
  createdAt: string
  updatedAt: string
}

export type ClinicalEntryType = 'evolution' | 'diagnosis' | 'procedure' | 'note' | 'attachment'

export interface ClinicalEntry {
  id: string
  patientId: string
  dentistId: string
  type: ClinicalEntryType
  title: string
  content: string
  diagnosisCode?: string
  procedureId?: string
  attachmentName?: string
  createdAt: string
}

export interface ToothState {
  toothId: string
  status: 'healthy' | 'caries' | 'filled' | 'missing' | 'crown'
}

export interface OdontogramState {
  patientId: string
  teeth: ToothState[]
  updatedAt: string
}

export interface InvoiceLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  treatmentId?: string
}

export interface Invoice {
  id: string
  patientId: string
  status: InvoiceStatus
  issuedAt: string
  dueAt: string
  lines: InvoiceLine[]
  subtotal: number
  tax: number
  total: number
  amountPaid: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  method: 'cash' | 'card' | 'transfer'
  paidAt: string
  reference: string
}

export interface InventoryItem {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  stock: number
  minStock: number
  unitCost: number
  supplier: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  itemId: string
  type: 'in' | 'out'
  quantity: number
  reason: string
  relatedTreatmentId?: string
  createdAt: string
}

export interface ClinicSettings {
  name: string
  taxId: string
  phone: string
  email: string
  address: string
  openingHours: string
}

export interface MockUserAccount {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
}
