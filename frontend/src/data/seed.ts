import type { MockUserAccount } from '@/types/domain'
import { generateBulkSeed } from '@/data/generateBulkSeed'

const bulk = generateBulkSeed()

export const SEED_USERS = bulk.SEED_USERS
export const SEED_DENTISTS = bulk.SEED_DENTISTS
export const SEED_PATIENTS = bulk.SEED_PATIENTS
export const SEED_PROCEDURES = bulk.SEED_PROCEDURES
export const SEED_APPOINTMENTS = bulk.SEED_APPOINTMENTS
export const SEED_TREATMENTS = bulk.SEED_TREATMENTS
export const SEED_CLINICAL = bulk.SEED_CLINICAL
export const SEED_ODONTOGRAMS = bulk.SEED_ODONTOGRAMS
export const SEED_INVOICES = bulk.SEED_INVOICES
export const SEED_PAYMENTS = bulk.SEED_PAYMENTS
export const SEED_INVENTORY = bulk.SEED_INVENTORY
export const SEED_MOVEMENTS = bulk.SEED_MOVEMENTS
export const SEED_CLINIC = bulk.SEED_CLINIC

export const SEED_STAFF_ACCOUNTS: MockUserAccount[] = SEED_USERS.map((u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  active: true,
}))

export function cloneSeed<T>(data: T): T {
  return structuredClone(data)
}
