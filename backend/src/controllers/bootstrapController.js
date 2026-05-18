import { query } from '../config/database.js'
import { mappers } from '../utils/mappers.js'

export async function getBootstrap(_req, res, next) {
  try {
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
    ])

    const linesByInvoice = lines.rows.reduce((acc, l) => {
      const mapped = mappers.invoiceLine(l)
      if (!acc[l.invoice_id]) acc[l.invoice_id] = []
      acc[l.invoice_id].push(mapped)
      return acc
    }, {})

    const clinicRow = clinic.rows[0]
    res.json({
      users: users.rows.map(mappers.user),
      dentists: dentists.rows.map(mappers.dentist),
      patients: patients.rows.map(mappers.patient),
      procedures: procedures.rows.map(mappers.procedure),
      appointments: appointments.rows.map(mappers.appointment),
      treatments: treatments.rows.map(mappers.treatment),
      clinicalEntries: clinical.rows.map(mappers.clinical),
      odontograms: odontograms.rows.map((o) => ({
        patientId: o.patient_id,
        teeth: o.teeth,
        updatedAt: o.updated_at?.toISOString?.() ?? o.updated_at,
      })),
      invoices: invoices.rows.map((inv) => mappers.invoice(inv, linesByInvoice[inv.id] ?? [])),
      payments: payments.rows.map(mappers.payment),
      inventory: inventory.rows.map(mappers.inventory),
      movements: movements.rows.map(mappers.movement),
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
  } catch (e) {
    next(e)
  }
}
