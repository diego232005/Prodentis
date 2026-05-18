import { generateBulkSeed } from './generateBulkSeed.js'

const bulk = generateBulkSeed()

export const seedUsers = bulk.seedUsers
export const seedDentists = bulk.seedDentists
export const seedPatients = bulk.seedPatients
export const seedProcedures = bulk.seedProcedures
export const seedAppointments = bulk.seedAppointments
export const seedTreatments = bulk.seedTreatments
export const seedClinical = bulk.seedClinical
export const seedOdontograms = bulk.seedOdontograms
export const seedInvoices = bulk.seedInvoices
export const seedInvoiceLines = bulk.seedInvoiceLines
export const seedPayments = bulk.seedPayments
export const seedInventory = bulk.seedInventory
export const seedMovements = bulk.seedMovements
export const seedClinic = bulk.seedClinic
