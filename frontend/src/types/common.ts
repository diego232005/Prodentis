export type UserRole = 'admin' | 'receptionist' | 'dentist' | 'assistant'

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type InvoiceStatus = 'pending' | 'paid' | 'void' | 'partial'

export type PatientStatus = 'active' | 'inactive' | 'archived'

export type TreatmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}
