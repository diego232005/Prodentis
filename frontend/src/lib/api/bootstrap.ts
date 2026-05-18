import { apiClient } from '@/lib/api/client'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import type {
  Appointment,
  ClinicalEntry,
  Dentist,
  InventoryItem,
  Invoice,
  MockUser,
  MockUserAccount,
  OdontogramState,
  Patient,
  Payment,
  ProcedureCatalogItem,
  StockMovement,
  Treatment,
} from '@/types/domain'
import type { ClinicSettings } from '@/types/domain'

export interface BootstrapPayload {
  users: MockUser[]
  dentists: Dentist[]
  patients: Patient[]
  procedures: ProcedureCatalogItem[]
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
}

export async function fetchBootstrap(): Promise<BootstrapPayload> {
  return apiClient.get<BootstrapPayload>('/bootstrap')
}

export async function hydrateAppFromApi(): Promise<void> {
  const data = await fetchBootstrap()
  useAppDataStore.setState({
    users: data.users,
    dentists: data.dentists,
    patients: data.patients,
    procedures: data.procedures,
    appointments: data.appointments,
    treatments: data.treatments,
    clinicalEntries: data.clinicalEntries,
    odontograms: data.odontograms,
    invoices: data.invoices,
    payments: data.payments,
    inventory: data.inventory,
    movements: data.movements,
    clinic: data.clinic,
    staffAccounts: data.staffAccounts,
  })
}
