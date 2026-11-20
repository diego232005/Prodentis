import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool, query } from '../config/database.js'
import {
  seedUsers,
  seedDentists,
  seedPatients,
  seedProcedures,
  seedAppointments,
  seedTreatments,
  seedClinical,
  seedOdontograms,
  seedInvoices,
  seedInvoiceLines,
  seedPayments,
  seedInventory,
  seedMovements,
  seedClinic,
} from './seedData.js'
import { seedExtras } from './seedExtras.js'
import { refreshTodayDemo } from './refreshToday.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function runSchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  await query(schema)
}

async function runMigrations() {
  const sql = fs.readFileSync(path.join(__dirname, 'migrate.sql'), 'utf8')
  await query(sql)
}

const CHUNK = 80

async function insertRows(table, columns, rows) {
  if (!rows.length) return
  const cols = columns.join(', ')
  for (let offset = 0; offset < rows.length; offset += CHUNK) {
    const chunk = rows.slice(offset, offset + CHUNK)
    const placeholders = chunk
      .map((_, i) => {
        const base = i * columns.length
        return `(${columns.map((__, j) => `$${base + j + 1}`).join(', ')})`
      })
      .join(', ')
    const values = chunk.flatMap((row) => columns.map((c) => row[c]))
    await query(`INSERT INTO ${table} (${cols}) VALUES ${placeholders} ON CONFLICT DO NOTHING`, values)
  }
}

async function resetDatabase() {
  await query(`
    TRUNCATE TABLE
      cash_closures, treatment_plan_items, treatment_plans, diagnostic_files, prescriptions, medications,
      periodontograms, odontogram_snapshots, consents, consent_templates, dentist_blocks, dentist_availability,
      dental_chairs,
      stock_movements, invoice_lines, payments, invoices,
      clinical_entries, odontograms, treatments, appointments,
      inventory_items, patients, procedures, dentists, users,
      clinic_settings
    RESTART IDENTITY CASCADE
  `)
}

async function seedAll() {

  await insertRows('users', ['id', 'email', 'password', 'name', 'role'], seedUsers)
  await insertRows('dentists', ['id', 'user_id', 'name', 'specialty', 'license_number'], seedDentists)
  await insertRows(
    'patients',
    ['id', 'first_name', 'last_name', 'document_id', 'birth_date', 'phone', 'email', 'address', 'status', 'allergies', 'medical_notes', 'created_at', 'updated_at'],
    seedPatients,
  )
  await insertRows('procedures', ['id', 'code', 'name', 'description', 'base_price', 'duration_minutes'], seedProcedures)
  await insertRows(
    'appointments',
    ['id', 'patient_id', 'dentist_id', 'start_at', 'end_at', 'status', 'reason', 'notes', 'created_at', 'updated_at'],
    seedAppointments,
  )
  await insertRows(
    'treatments',
    ['id', 'patient_id', 'dentist_id', 'procedure_id', 'status', 'start_date', 'end_date', 'sessions_planned', 'sessions_done', 'cost', 'notes', 'created_at', 'updated_at'],
    seedTreatments,
  )
  await insertRows(
    'clinical_entries',
    ['id', 'patient_id', 'dentist_id', 'type', 'title', 'content', 'diagnosis_code', 'procedure_id', 'attachment_name', 'created_at'],
    seedClinical,
  )
  for (const o of seedOdontograms) {
    await query(
      `INSERT INTO odontograms (patient_id, teeth, updated_at) VALUES ($1, $2::jsonb, $3) ON CONFLICT DO NOTHING`,
      [o.patient_id, JSON.stringify(o.teeth), o.updated_at],
    )
  }
  await insertRows(
    'invoices',
    ['id', 'patient_id', 'status', 'issued_at', 'due_at', 'subtotal', 'tax', 'total', 'amount_paid', 'notes', 'created_at', 'updated_at'],
    seedInvoices,
  )
  await insertRows('invoice_lines', ['id', 'invoice_id', 'description', 'quantity', 'unit_price', 'treatment_id'], seedInvoiceLines)
  await insertRows('payments', ['id', 'invoice_id', 'amount', 'method', 'paid_at', 'reference'], seedPayments)
  await insertRows(
    'inventory_items',
    ['id', 'sku', 'name', 'category', 'unit', 'stock', 'min_stock', 'unit_cost', 'supplier', 'updated_at'],
    seedInventory,
  )
  await insertRows('stock_movements', ['id', 'item_id', 'type', 'quantity', 'reason', 'related_treatment_id', 'created_at'], seedMovements)
  await query(
    `INSERT INTO clinic_settings (id, name, tax_id, phone, email, address, opening_hours)
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
    [seedClinic.id, seedClinic.name, seedClinic.tax_id, seedClinic.phone, seedClinic.email, seedClinic.address, seedClinic.opening_hours],
  )
}

export async function ensureDatabase({ force = false } = {}) {
  await runSchema()
  await runMigrations()
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM patients')
  const shouldSeed = rows[0].n === 0 || force
  if (shouldSeed) {
    if (force) await resetDatabase()
    await seedAll()
  }
  await seedExtras()
  await refreshTodayDemo()
  return shouldSeed
}

if (process.argv[1]?.endsWith('init.js')) {
  const force = process.argv.includes('--force')
  ensureDatabase({ force })
    .then((seeded) => {
      console.log(
        seeded
          ? `Base de datos inicializada (${seedPatients.length} pacientes, ${seedAppointments.length} citas, etc.).`
          : 'La base ya tenía datos. Usá: node src/db/init.js --force',
      )
      process.exit(0)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
    .finally(() => pool.end())
}
