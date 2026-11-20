import { query } from '../config/database.js'
import { mappers } from '../utils/mappers.js'
import { appTimezone } from '../utils/time.js'
import { wrap } from '../utils/http.js'
import { CONSENT_COLUMNS } from './consentsController.js'
import { DIAGNOSTIC_COLUMNS } from './clinicalController.js'

const groupBy = (rows, key, map) =>
  rows.reduce((acc, r) => {
    ;(acc[r[key]] ??= []).push(map(r))
    return acc
  }, {})

export const getBootstrap = wrap(async (_req, res) => {
  const [
    users,
    dentists,
    patients,
    procedures,
    appointments,
    treatments,
    clinical,
    odontograms,
    invoices,
    lines,
    payments,
    inventory,
    movements,
    clinic,
    chairs,
    availability,
    blocks,
    consentTemplates,
    consents,
    snapshots,
    periodontograms,
    medications,
    prescriptions,
    diagnostics,
    plans,
    planItems,
    closures,
  ] = await Promise.all([
    query('SELECT * FROM users'),
    query('SELECT * FROM dentists'),
    query('SELECT * FROM patients ORDER BY updated_at DESC'),
    query('SELECT * FROM procedures'),
    query('SELECT * FROM appointments ORDER BY start_at ASC'),
    query('SELECT * FROM treatments'),
    query('SELECT * FROM clinical_entries ORDER BY created_at DESC'),
    query('SELECT * FROM odontograms'),
    query('SELECT * FROM invoices'),
    query('SELECT * FROM invoice_lines'),
    query('SELECT * FROM payments'),
    query('SELECT * FROM inventory_items ORDER BY name'),
    query('SELECT * FROM stock_movements ORDER BY created_at DESC'),
    query('SELECT * FROM clinic_settings WHERE id = 1'),
    query('SELECT * FROM dental_chairs ORDER BY sort_order, name'),
    query('SELECT * FROM dentist_availability ORDER BY dentist_id, weekday, start_time'),
    query('SELECT * FROM dentist_blocks WHERE end_at > NOW() - INTERVAL \'30 days\' ORDER BY start_at'),
    query('SELECT * FROM consent_templates ORDER BY title'),
    query(`SELECT ${CONSENT_COLUMNS} FROM consents ORDER BY created_at DESC`),
    query('SELECT * FROM odontogram_snapshots ORDER BY created_at DESC'),
    query('SELECT * FROM periodontograms ORDER BY created_at DESC'),
    query('SELECT * FROM medications ORDER BY name'),
    query('SELECT * FROM prescriptions ORDER BY created_at DESC'),
    query(`SELECT ${DIAGNOSTIC_COLUMNS} FROM diagnostic_files ORDER BY created_at DESC`),
    query('SELECT * FROM treatment_plans ORDER BY created_at DESC'),
    query('SELECT * FROM treatment_plan_items ORDER BY sort_order, id'),
    query('SELECT * FROM cash_closures ORDER BY closure_date DESC LIMIT 90'),
  ])

  const linesByInvoice = groupBy(lines.rows, 'invoice_id', mappers.invoiceLine)
  const itemsByPlan = groupBy(planItems.rows, 'plan_id', mappers.planItem)
  const clinicRow = clinic.rows[0]

  res.json({
    timezone: appTimezone(),
    users: users.rows.map(mappers.user),
    dentists: dentists.rows.map(mappers.dentist),
    patients: patients.rows.map(mappers.patient),
    procedures: procedures.rows.map(mappers.procedure),
    appointments: appointments.rows.map(mappers.appointment),
    treatments: treatments.rows.map(mappers.treatment),
    clinicalEntries: clinical.rows.map(mappers.clinical),
    odontograms: odontograms.rows.map(mappers.odontogram),
    odontogramSnapshots: snapshots.rows.map(mappers.snapshot),
    periodontograms: periodontograms.rows.map(mappers.periodontogram),
    invoices: invoices.rows.map((inv) => mappers.invoice(inv, linesByInvoice[inv.id] ?? [])),
    payments: payments.rows.map(mappers.payment),
    cashClosures: closures.rows.map(mappers.cashClosure),
    inventory: inventory.rows.map(mappers.inventory),
    movements: movements.rows.map(mappers.movement),
    chairs: chairs.rows.map(mappers.chair),
    dentistAvailability: availability.rows.map(mappers.availability),
    dentistBlocks: blocks.rows.map(mappers.block),
    consentTemplates: consentTemplates.rows.map(mappers.consentTemplate),
    consents: consents.rows.map(mappers.consent),
    medications: medications.rows.map(mappers.medication),
    prescriptions: prescriptions.rows.map(mappers.prescription),
    diagnosticFiles: diagnostics.rows.map(mappers.diagnostic),
    treatmentPlans: plans.rows.map((p) => mappers.treatmentPlan(p, itemsByPlan[p.id] ?? [])),
    clinic: clinicRow
      ? {
          name: clinicRow.name,
          taxId: clinicRow.tax_id,
          phone: clinicRow.phone,
          email: clinicRow.email,
          address: clinicRow.address,
          openingHours: clinicRow.opening_hours,
        }
      : null,
    staffAccounts: users.rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: true,
    })),
  })
})
