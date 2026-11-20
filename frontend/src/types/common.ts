export type UserRole = 'admin' | 'receptionist' | 'dentist' | 'assistant'

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type InvoiceStatus = 'pending' | 'paid' | 'void' | 'partial'

export type PatientStatus = 'active' | 'inactive' | 'archived'

export type TreatmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export type ToothStatus =
  | 'healthy'
  | 'caries'
  | 'filled'
  | 'missing'
  | 'crown'
  | 'endodontics'
  | 'extraction'
  | 'implant'
  | 'fracture'
  | 'sealant'
  | 'bridge'
  | 'prosthesis'

export type ToothSurface = 'V' | 'L' | 'M' | 'D' | 'O'

export type TreatmentPlanStatus = 'proposed' | 'accepted' | 'in_progress' | 'completed' | 'rejected'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}
