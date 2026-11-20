import type {
  AppointmentStatus,
  InvoiceStatus,
  PatientStatus,
  ToothStatus,
  ToothSurface,
  TreatmentPlanStatus,
  TreatmentStatus,
  UserRole,
} from '@/types/common'

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
  gender?: 'female' | 'male' | 'other' | ''
  occupation?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  insuranceProvider?: string
  insuranceNumber?: string
  bloodType?: string
  currentMedications?: string
  chronicDiseases?: string
  previousSurgeries?: string
  isPregnant?: boolean
  smoker?: boolean
  bruxism?: boolean
  anamnesisNotes?: string
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
  chairId?: string
  procedureId?: string
  arrivedAt?: string
}

export interface DentalChair {
  id: string
  name: string
  active: boolean
}

export interface DentistAvailability {
  id: string
  dentistId: string
  /** 0 = domingo … 6 = sábado */
  weekday: number
  startTime: string
  endTime: string
}

export interface DentistBlock {
  id: string
  dentistId: string
  startAt: string
  endAt: string
  reason: string
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
  chiefComplaint?: string
  currentIllness?: string
  physicalExam?: string
  diagnosis?: string
  treatmentPerformed?: string
  indications?: string
  nextVisit?: string
  toothId?: string
  signedBy?: string
}

export interface ToothState {
  toothId: string
  status: ToothStatus
  surfaces?: Partial<Record<ToothSurface, ToothStatus>>
  notes?: string
}

export interface OdontogramState {
  patientId: string
  teeth: ToothState[]
  updatedAt: string
  dentition?: 'adult' | 'pediatric'
}

export interface OdontogramSnapshot {
  id: string
  patientId: string
  dentistId?: string
  label: string
  teeth: ToothState[]
  createdAt: string
}

export interface PeriodontogramEntry {
  id: string
  patientId: string
  toothId: string
  /** Profundidad de sondaje (mm): [distal, central, mesial] */
  probingVestibular: [number, number, number]
  probingLingual: [number, number, number]
  mobility: 0 | 1 | 2 | 3
  bleeding: boolean
  plaque: boolean
  recession?: number
  recordedAt: string
}

export interface ConsentTemplate {
  id: string
  title: string
  body: string
}

export interface Consent {
  id: string
  patientId: string
  templateId?: string
  title: string
  body: string
  procedureName?: string
  signatureDataUrl?: string
  signatureData?: string
  signedAt?: string
  signedByName?: string
  witnessName?: string
  dentistId?: string
  createdAt: string
  pdfReady?: boolean
}

export interface Medication {
  id: string
  name: string
  presentation: string
  defaultDose?: string
}

export interface PrescriptionItem {
  medicationId?: string
  name: string
  dose: string
  frequency: string
  duration: string
  notes?: string
}

export interface Prescription {
  id: string
  patientId: string
  dentistId: string
  items: PrescriptionItem[]
  diagnosis?: string
  indications?: string
  createdAt: string
}

export interface DiagnosticFile {
  id: string
  patientId: string
  name?: string
  title?: string
  kind?: 'xray' | 'photo' | 'document' | 'other'
  fileType?: string
  mimeType: string
  /** data URL o URL absoluta */
  url?: string
  imageData?: string
  toothId?: string
  notes?: string
  uploadedAt?: string
  createdAt?: string
  takenAt?: string
}

export interface TreatmentPlanItem {
  id: string
  description: string
  toothId?: string
  procedureId?: string
  price: number
  done: boolean
}

export interface TreatmentPlan {
  id: string
  patientId: string
  dentistId: string
  title: string
  status: TreatmentPlanStatus
  items: TreatmentPlanItem[]
  total: number
  createdAt: string
  updatedAt: string
}

export interface CashClosure {
  id: string
  date: string
  openedBy?: string
  closedBy: string
  totalCash: number
  totalCard: number
  totalTransfer: number
  total: number
  paymentsCount: number
  notes: string
  createdAt: string
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
