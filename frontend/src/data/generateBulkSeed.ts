import type {
  Appointment,
  ClinicSettings,
  ClinicalEntry,
  Dentist,
  InventoryItem,
  Invoice,
  InvoiceLine,
  MockUser,
  OdontogramState,
  Patient,
  Payment,
  ProcedureCatalogItem,
  StockMovement,
  Treatment,
} from '@/types/domain'
import type { AppointmentStatus, InvoiceStatus, PatientStatus, TreatmentStatus } from '@/types/common'

const now = new Date()
const iso = (d: Date) => d.toISOString()
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const FIRST_NAMES = [
  'Jorge', 'Laura', 'Roberto', 'Valentina', 'Miguel', 'Sofía', 'Carlos', 'Ana', 'Diego', 'María',
  'Lucas', 'Camila', 'Martín', 'Julia', 'Pablo', 'Elena', 'Fernando', 'Lucía', 'Ricardo', 'Paula',
]
const LAST_NAMES = [
  'Pérez', 'Martínez', 'Díaz', 'López', 'Acosta', 'Núñez', 'González', 'Rodríguez', 'Fernández', 'García',
  'Romero', 'Torres', 'Álvarez', 'Ruiz', 'Medina', 'Herrera', 'Silva', 'Molina', 'Castro', 'Vega',
]

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

function dayAt(offset: number, h = 10, m = 0) {
  const d = new Date(now)
  d.setDate(d.getDate() + offset)
  d.setHours(h, m, 0, 0)
  return d
}

function monthAt(monthsAgo: number, day = 15, hour = 10) {
  const d = new Date(now)
  d.setMonth(d.getMonth() - monthsAgo)
  d.setDate(Math.min(day, 28))
  d.setHours(hour, 0, 0, 0)
  return d
}

function defaultTeeth(): OdontogramState['teeth'] {
  const ids = [
    '18', '17', '16', '15', '14', '13', '12', '11',
    '21', '22', '23', '24', '25', '26', '27', '28',
    '48', '47', '46', '45', '44', '43', '42', '41',
    '31', '32', '33', '34', '35', '36', '37', '38',
  ]
  const statuses = ['healthy', 'healthy', 'healthy', 'caries', 'filled', 'missing', 'crown'] as const
  return ids.map((toothId) => ({ toothId, status: pick([...statuses]) }))
}

export function generateBulkSeed() {
  const SEED_USERS: MockUser[] = [
    { id: 'u-admin', email: 'admin@prodentis.com', password: 'admin123', name: 'María González', role: 'admin' },
    { id: 'u-recep', email: 'recepcion@prodentis.com', password: 'recep123', name: 'Lucía Fernández', role: 'receptionist' },
    { id: 'u-dent1', email: 'odontologo@prodentis.com', password: 'dent123', name: 'Dr. Carlos Méndez', role: 'dentist' },
    { id: 'u-dent2', email: 'odontologo2@prodentis.com', password: 'dent123', name: 'Dra. Ana Ruiz', role: 'dentist' },
    { id: 'u-aux', email: 'auxiliar@prodentis.com', password: 'aux123', name: 'Pedro Sánchez', role: 'assistant' },
  ]

  const SEED_DENTISTS: Dentist[] = [
    { id: 'd1', userId: 'u-dent1', name: 'Dr. Carlos Méndez', specialty: 'Odontología general', licenseNumber: 'MP 45231' },
    { id: 'd2', userId: 'u-dent2', name: 'Dra. Ana Ruiz', specialty: 'Endodoncia', licenseNumber: 'MP 44102' },
  ]
  const dentistIds = SEED_DENTISTS.map((d) => d.id)

  const SEED_PROCEDURES: ProcedureCatalogItem[] = [
    { id: 'pr1', code: 'COND', name: 'Consulta y diagnóstico', description: 'Evaluación clínica inicial', basePrice: 15000, durationMinutes: 30 },
    { id: 'pr2', code: 'LIM', name: 'Limpieza con ultrasonido', description: 'Profilaxis completa', basePrice: 28000, durationMinutes: 45 },
    { id: 'pr3', code: 'RES', name: 'Restauración composite', description: '1 superficie', basePrice: 45000, durationMinutes: 60 },
    { id: 'pr4', code: 'END', name: 'Tratamiento de conducto', description: 'Pieza molar', basePrice: 120000, durationMinutes: 90 },
    { id: 'pr5', code: 'EXT', name: 'Extracción simple', description: 'Incluye control', basePrice: 35000, durationMinutes: 45 },
    { id: 'pr6', code: 'ORT', name: 'Control ortodoncia', description: 'Ajuste brackets', basePrice: 32000, durationMinutes: 40 },
    { id: 'pr7', code: 'BLA', name: 'Blanqueamiento dental', description: 'Sesión consultorio', basePrice: 85000, durationMinutes: 75 },
    { id: 'pr8', code: 'COR', name: 'Corona cerámica', description: 'Preparación y toma', basePrice: 180000, durationMinutes: 120 },
    { id: 'pr9', code: 'IMP', name: 'Implante unitario', description: 'Cirugía fase 1', basePrice: 350000, durationMinutes: 90 },
    { id: 'pr10', code: 'PER', name: 'Tratamiento periodontal', description: 'Raspado y alisado', basePrice: 55000, durationMinutes: 60 },
  ]

  const SEED_PATIENTS: Patient[] = []
  for (let i = 1; i <= 65; i++) {
    const fn = FIRST_NAMES[(i - 1) % FIRST_NAMES.length]
    const ln = LAST_NAMES[(i - 1) % LAST_NAMES.length]
    const created = monthAt(rand(0, 11), rand(1, 28))
    SEED_PATIENTS.push({
      id: `p${i}`,
      firstName: fn,
      lastName: ln,
      documentId: String(20000000 + i * 137),
      birthDate: iso(new Date(1960 + rand(0, 40), rand(0, 11), rand(1, 28))).slice(0, 10),
      phone: `+54 11 5555-${String(1000 + i).slice(-4)}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@email.com`,
      address: `Av. Demo ${rand(100, 5000)}, CABA`,
      status: (i % 17 === 0 ? 'inactive' : i % 23 === 0 ? 'archived' : 'active') as PatientStatus,
      allergies: pick(['', 'Penicilina', 'Látex', 'Ibuprofeno']),
      medicalNotes: i % 5 === 0 ? 'Control médico anual' : '',
      createdAt: iso(created),
      updatedAt: iso(now),
    })
  }
  const patientIds = SEED_PATIENTS.map((p) => p.id)

  const aptStatuses: AppointmentStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
  const SEED_APPOINTMENTS: Appointment[] = []
  const reasons = ['Control', 'Limpieza', 'Restauración', 'Endodoncia', 'Urgencia', 'Ortodoncia']
  for (let i = 1; i <= 185; i++) {
    const dayOffset = -rand(0, 330)
    const hour = 8 + rand(0, 9)
    const start = dayAt(dayOffset, hour, pick([0, 15, 30]))
    const end = new Date(start.getTime() + pick([30, 45, 60, 90]) * 60000)
    SEED_APPOINTMENTS.push({
      id: `a${i}`,
      patientId: pick(patientIds),
      dentistId: pick(dentistIds),
      startAt: iso(start),
      endAt: iso(end),
      status: weightedPick(aptStatuses, [12, 28, 8, 45, 7]),
      reason: pick(reasons),
      notes: '',
      createdAt: iso(dayAt(dayOffset - 5, 9)),
      updatedAt: iso(now),
    })
  }

  const treatStatuses: TreatmentStatus[] = ['planned', 'in_progress', 'completed', 'cancelled']
  const SEED_TREATMENTS: Treatment[] = []
  for (let i = 1; i <= 95; i++) {
    const proc = pick(SEED_PROCEDURES)
    const status = weightedPick(treatStatuses, [15, 25, 52, 8])
    const start = monthAt(rand(0, 10))
    const completed = status === 'completed'
    SEED_TREATMENTS.push({
      id: `t${i}`,
      patientId: pick(patientIds),
      dentistId: pick(dentistIds),
      procedureId: proc.id,
      status,
      startDate: iso(start),
      endDate: completed ? iso(new Date(start.getTime() + rand(3, 40) * 86400000)) : undefined,
      sessionsPlanned: rand(1, 4),
      sessionsDone: completed ? rand(1, 4) : rand(0, 2),
      cost: proc.basePrice,
      notes: `Tratamiento ${proc.code}`,
      createdAt: iso(start),
      updatedAt: iso(now),
    })
  }

  const clinicalTypes = ['evolution', 'diagnosis', 'procedure', 'note'] as const
  const SEED_CLINICAL: ClinicalEntry[] = []
  for (let i = 1; i <= 130; i++) {
    const type = pick([...clinicalTypes])
    const created = monthAt(rand(0, 11), rand(1, 28))
    SEED_CLINICAL.push({
      id: `c${i}`,
      patientId: pick(patientIds),
      dentistId: pick(dentistIds),
      type,
      title: pick(['Diagnóstico', 'Evolución', 'Procedimiento', 'Nota clínica']),
      content: `Registro clínico #${i} — seguimiento del paciente.`,
      diagnosisCode: type === 'diagnosis' ? `K02.${rand(0, 9)}` : undefined,
      procedureId: type === 'procedure' ? pick(SEED_PROCEDURES).id : undefined,
      createdAt: iso(created),
    })
  }

  const SEED_ODONTOGRAMS: OdontogramState[] = patientIds.slice(0, 40).map((patientId, idx) => ({
    patientId,
    teeth: defaultTeeth(),
    updatedAt: iso(monthAt(idx % 8)),
  }))

  const invStatuses: InvoiceStatus[] = ['pending', 'paid', 'partial', 'void']
  const SEED_INVOICES: Invoice[] = []
  const allLines: InvoiceLine[] = []
  const SEED_PAYMENTS: Payment[] = []
  let lineN = 1
  let payN = 1

  for (let i = 1; i <= 78; i++) {
    const proc = pick(SEED_PROCEDURES)
    const qty = rand(1, 3)
    const subtotal = proc.basePrice * qty
    const tax = Math.round(subtotal * 0.21)
    const total = subtotal + tax
    const status = weightedPick(invStatuses, [15, 55, 22, 8])
    const issued = monthAt(rand(0, 11))
    const due = new Date(issued)
    due.setDate(due.getDate() + 20)
    let amountPaid = 0
    if (status === 'paid') amountPaid = total
    else if (status === 'partial') amountPaid = Math.round(total * 0.5)

    const invId = `inv${i}`
    const lines: InvoiceLine[] = [{
      id: `l${lineN++}`,
      description: proc.name,
      quantity: qty,
      unitPrice: proc.basePrice,
      treatmentId: i <= 95 ? `t${i}` : undefined,
    }]
    allLines.push(...lines)
    SEED_INVOICES.push({
      id: invId,
      patientId: pick(patientIds),
      status,
      issuedAt: iso(issued),
      dueAt: iso(due),
      lines,
      subtotal,
      tax,
      total,
      amountPaid,
      notes: status === 'void' ? 'Anulada' : '',
      createdAt: iso(issued),
      updatedAt: iso(now),
    })
    if (amountPaid > 0) {
      SEED_PAYMENTS.push({
        id: `pay${payN++}`,
        invoiceId: invId,
        amount: amountPaid,
        method: pick(['cash', 'card', 'transfer']),
        paidAt: iso(new Date(issued.getTime() + 86400000 * 3)),
        reference: `REF-${i}`,
      })
    }
  }

  const catalog = [
    { sku: 'GU', name: 'Guantes nitrilo', category: 'Protección', unit: 'caja', unitCost: 12000 },
    { sku: 'RES', name: 'Resina composite', category: 'Material', unit: 'unidad', unitCost: 22000 },
    { sku: 'ANES', name: 'Anestesia carpule', category: 'Medicamento', unit: 'carpule', unitCost: 450 },
    { sku: 'BRO', name: 'Broca diamantada', category: 'Instrumental', unit: 'unidad', unitCost: 18000 },
  ]
  const SEED_INVENTORY: InventoryItem[] = []
  for (let i = 1; i <= 52; i++) {
    const b = catalog[(i - 1) % catalog.length]
    SEED_INVENTORY.push({
      id: `i${i}`,
      sku: `${b.sku}-${i}`,
      name: b.name,
      category: b.category,
      unit: b.unit,
      stock: rand(2, 90),
      minStock: rand(5, 15),
      unitCost: b.unitCost,
      supplier: pick(['DentalMed', '3M', 'FarmaDent']),
      updatedAt: iso(now),
    })
  }
  const itemIds = SEED_INVENTORY.map((x) => x.id)

  const SEED_MOVEMENTS: StockMovement[] = []
  for (let i = 1; i <= 160; i++) {
    SEED_MOVEMENTS.push({
      id: `m${i}`,
      itemId: pick(itemIds),
      type: i % 4 === 0 ? 'in' : 'out',
      quantity: rand(1, 12),
      reason: pick(['Consumo', 'Compra', 'Tratamiento', 'Ajuste']),
      relatedTreatmentId: i % 3 === 0 ? `t${rand(1, 95)}` : undefined,
      createdAt: iso(monthAt(rand(0, 11))),
    })
  }

  const SEED_CLINIC: ClinicSettings = {
    name: 'Consultorio Odontológico PRODENTIS',
    taxId: '30-71555444-8',
    phone: '+54 11 4555-9090',
    email: 'contacto@prodentis.local',
    address: 'Av. del Libertador 5000, C1426 CABA',
    openingHours: 'Lun–Vie 9:00–19:00 · Sáb 9:00–13:00',
  }

  return {
    SEED_USERS,
    SEED_DENTISTS,
    SEED_PATIENTS,
    SEED_PROCEDURES,
    SEED_APPOINTMENTS,
    SEED_TREATMENTS,
    SEED_CLINICAL,
    SEED_ODONTOGRAMS,
    SEED_INVOICES,
    SEED_PAYMENTS,
    SEED_INVENTORY,
    SEED_MOVEMENTS,
    SEED_CLINIC,
  }
}
