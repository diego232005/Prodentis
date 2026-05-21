const now = new Date()
const iso = (d) => (d instanceof Date ? d : new Date(d)).toISOString()
const dateOnly = (d) => iso(d).slice(0, 10)

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const FIRST_NAMES = [
  'Jorge', 'Laura', 'Roberto', 'Valentina', 'Miguel', 'Sofía', 'Carlos', 'Ana', 'Diego', 'María',
  'Lucas', 'Camila', 'Martín', 'Julia', 'Pablo', 'Elena', 'Fernando', 'Lucía', 'Ricardo', 'Paula',
  'Andrés', 'Clara', 'Gabriel', 'Natalia', 'Hugo', 'Victoria', 'Emilio', 'Renata', 'Tomás', 'Agustina',
  'Felipe', 'Bianca', 'Sebastián', 'Mora', 'Ignacio', 'Celeste', 'Matías', 'Florencia', 'Nicolás', 'Julieta',
]
const LAST_NAMES = [
  'Pérez', 'Martínez', 'Díaz', 'López', 'Acosta', 'Núñez', 'González', 'Rodríguez', 'Fernández', 'García',
  'Romero', 'Torres', 'Álvarez', 'Ruiz', 'Medina', 'Herrera', 'Silva', 'Molina', 'Castro', 'Vega',
  'Ramos', 'Cabrera', 'Ortiz', 'Suárez', 'Benítez', 'Peralta', 'Giménez', 'Acuña', 'Domínguez', 'Ibarra',
]
const STREETS = ['Av. Corrientes', 'Santa Fe', 'Cabildo', 'Rivadavia', 'Belgrano', 'San Martín', 'Libertador', 'Córdoba']
const ALLERGIES = ['', '', 'Penicilina', 'Látex', 'Ibuprofeno', 'Ninguna conocida', 'Aspirina']
const APT_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
const APT_WEIGHTS = [12, 28, 8, 45, 7]
const TREAT_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled']
const INV_STATUSES = ['pending', 'paid', 'partial', 'void']
const INV_WEIGHTS = [15, 55, 22, 8]
const CLINICAL_TYPES = ['evolution', 'diagnosis', 'procedure', 'note']
const TOOTH_STATUSES = ['healthy', 'healthy', 'healthy', 'caries', 'filled', 'missing', 'crown']
const PAY_METHODS = ['cash', 'card', 'transfer']
const INVENTORY_CATALOG = [
  { sku: 'GU', name: 'Guantes nitrilo', category: 'Protección', unit: 'caja', unit_cost: 12000 },
  { sku: 'MAS', name: 'Mascarillas quirúrgicas', category: 'Protección', unit: 'caja', unit_cost: 8500 },
  { sku: 'RES', name: 'Resina composite', category: 'Material', unit: 'unidad', unit_cost: 22000 },
  { sku: 'ANES', name: 'Anestesia carpule', category: 'Medicamento', unit: 'carpule', unit_cost: 450 },
  { sku: 'ALG', name: 'Algodón rollo', category: 'Desechable', unit: 'rollo', unit_cost: 3500 },
  { sku: 'BRO', name: 'Broca diamantada', category: 'Instrumental', unit: 'unidad', unit_cost: 18000 },
  { sku: 'CEM', name: 'Cemento ionómero', category: 'Material', unit: 'unidad', unit_cost: 15000 },
  { sku: 'HIL', name: 'Hilo de sutura', category: 'Desechable', unit: 'sobre', unit_cost: 6200 },
  { sku: 'IMP', name: 'Impresión alginato', category: 'Material', unit: 'bolsa', unit_cost: 9800 },
  { sku: 'BLD', name: 'Blanqueamiento kit', category: 'Estética', unit: 'kit', unit_cost: 45000 },
]
const SUPPLIERS = ['DentalMed', '3M', 'FarmaDent', 'Dentsply', 'Henry Schein']

function weightedPick(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

function dayAt(offsetDays, hour = 10, minute = 0) {
  const d = new Date(now)
  d.setDate(d.getDate() + offsetDays)
  d.setHours(hour, minute, 0, 0)
  return d
}

function monthAt(monthsAgo, day = 15, hour = 10) {
  const d = new Date(now)
  d.setMonth(d.getMonth() - monthsAgo)
  d.setDate(Math.min(day, 28))
  d.setHours(hour, 0, 0, 0)
  return d
}

function defaultTeeth() {
  const ids = [
    '18', '17', '16', '15', '14', '13', '12', '11',
    '21', '22', '23', '24', '25', '26', '27', '28',
    '48', '47', '46', '45', '44', '43', '42', '41',
    '31', '32', '33', '34', '35', '36', '37', '38',
  ]
  return ids.map((toothId) => ({ toothId, status: pick(TOOTH_STATUSES) }))
}

export function generateBulkSeed() {
  const seedUsers = [
    { id: 'u-admin', email: 'admin@prodentis.com', password: 'admin123', name: 'María González', role: 'admin' },
    { id: 'u-recep', email: 'recepcion@prodentis.com', password: 'recep123', name: 'Lucía Fernández', role: 'receptionist' },
    { id: 'u-dent1', email: 'odontologo@prodentis.com', password: 'dent123', name: 'Dr. Carlos Méndez', role: 'dentist' },
    { id: 'u-dent2', email: 'odontologo2@prodentis.com', password: 'dent123', name: 'Dra. Ana Ruiz', role: 'dentist' },
    { id: 'u-aux', email: 'auxiliar@prodentis.com', password: 'aux123', name: 'Pedro Sánchez', role: 'assistant' },
  ]

  const seedDentists = [
    { id: 'd1', user_id: 'u-dent1', name: 'Dr. Carlos Méndez', specialty: 'Odontología general', license_number: 'MP 45231' },
    { id: 'd2', user_id: 'u-dent2', name: 'Dra. Ana Ruiz', specialty: 'Endodoncia', license_number: 'MP 44102' },
  ]
  const dentistIds = seedDentists.map((d) => d.id)

  const seedProcedures = [
    { id: 'pr1', code: 'COND', name: 'Consulta y diagnóstico', description: 'Evaluación clínica inicial', base_price: 15000, duration_minutes: 30 },
    { id: 'pr2', code: 'LIM', name: 'Limpieza con ultrasonido', description: 'Profilaxis completa', base_price: 28000, duration_minutes: 45 },
    { id: 'pr3', code: 'RES', name: 'Restauración composite', description: '1 superficie', base_price: 45000, duration_minutes: 60 },
    { id: 'pr4', code: 'END', name: 'Tratamiento de conducto', description: 'Pieza molar', base_price: 120000, duration_minutes: 90 },
    { id: 'pr5', code: 'EXT', name: 'Extracción simple', description: 'Incluye control', base_price: 35000, duration_minutes: 45 },
    { id: 'pr6', code: 'ORT', name: 'Control ortodoncia', description: 'Ajuste brackets', base_price: 32000, duration_minutes: 40 },
    { id: 'pr7', code: 'BLA', name: 'Blanqueamiento dental', description: 'Sesión consultorio', base_price: 85000, duration_minutes: 75 },
    { id: 'pr8', code: 'COR', name: 'Corona cerámica', description: 'Preparación y toma', base_price: 180000, duration_minutes: 120 },
    { id: 'pr9', code: 'IMP', name: 'Implante unitario', description: 'Cirugía fase 1', base_price: 350000, duration_minutes: 90 },
    { id: 'pr10', code: 'PER', name: 'Tratamiento periodontal', description: 'Raspado y alisado', base_price: 55000, duration_minutes: 60 },
  ]
  const procedureIds = seedProcedures.map((p) => p.id)

  const PATIENT_COUNT = 65
  const seedPatients = []
  for (let i = 1; i <= PATIENT_COUNT; i++) {
    const fn = FIRST_NAMES[(i - 1) % FIRST_NAMES.length]
    const ln = LAST_NAMES[(i - 1) % LAST_NAMES.length]
    const monthsAgoCreated = rand(0, 11)
    const created = monthAt(monthsAgoCreated, rand(1, 28))
    const birthYear = 1955 + rand(0, 45)
    seedPatients.push({
      id: `p${i}`,
      first_name: fn,
      last_name: `${ln}${i > 30 ? ' ' + String.fromCharCode(65 + (i % 26)) : ''}`,
      document_id: String(20000000 + i * 137),
      birth_date: dateOnly(new Date(birthYear, rand(0, 11), rand(1, 28))),
      phone: `+54 11 5555-${String(1000 + i).slice(-4)}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@email.com`,
      address: `${pick(STREETS)} ${rand(100, 9900)}, CABA`,
      status: i % 17 === 0 ? 'inactive' : i % 23 === 0 ? 'archived' : 'active',
      allergies: pick(ALLERGIES),
      medical_notes: i % 5 === 0 ? 'Control médico anual recomendado' : '',
      created_at: iso(created),
      updated_at: iso(now),
    })
  }
  const patientIds = seedPatients.map((p) => p.id)

  const APT_COUNT = 185
  const seedAppointments = []
  const aptReasons = ['Control', 'Limpieza', 'Restauración', 'Endodoncia', 'Urgencia dolor', 'Ortodoncia', 'Extracción', 'Consulta inicial']
  for (let i = 1; i <= APT_COUNT; i++) {
    const monthsAgo = rand(0, 11)
    const dayOffset = -monthsAgo * 30 - rand(0, 25)
    const hour = 8 + rand(0, 9)
    const duration = pick([30, 45, 60, 90])
    const start = dayAt(dayOffset, hour, pick([0, 15, 30]))
    const end = new Date(start.getTime() + duration * 60000)
    const status = weightedPick(APT_STATUSES, APT_WEIGHTS)
    seedAppointments.push({
      id: `a${i}`,
      patient_id: pick(patientIds),
      dentist_id: pick(dentistIds),
      start_at: iso(start),
      end_at: iso(end),
      status,
      reason: pick(aptReasons),
      notes: i % 8 === 0 ? 'Recordar radiografía previa' : '',
      created_at: iso(dayAt(dayOffset - rand(1, 14), 9)),
      updated_at: iso(now),
    })
  }

  const todayAppointments = [
    { id: 'a-today-1', patient_id: 'p1', dentist_id: 'd1', h: 9, m: 0, status: 'completed', reason: 'Control' },
    { id: 'a-today-2', patient_id: 'p2', dentist_id: 'd1', h: 10, m: 30, status: 'completed', reason: 'Limpieza' },
    { id: 'a-today-3', patient_id: 'p3', dentist_id: 'd2', h: 11, m: 0, status: 'in_progress', reason: 'Restauración' },
    { id: 'a-today-4', patient_id: 'p4', dentist_id: 'd2', h: 14, m: 0, status: 'confirmed', reason: 'Endodoncia' },
    { id: 'a-today-5', patient_id: 'p5', dentist_id: 'd1', h: 15, m: 30, status: 'pending', reason: 'Consulta inicial' },
    { id: 'a-today-6', patient_id: 'p6', dentist_id: 'd1', h: 16, m: 0, status: 'confirmed', reason: 'Ortodoncia' },
    { id: 'a-today-7', patient_id: 'p7', dentist_id: 'd2', h: 17, m: 0, status: 'cancelled', reason: 'Urgencia dolor' },
  ]
  for (const t of todayAppointments) {
    const start = dayAt(0, t.h, t.m)
    const end = new Date(start.getTime() + 45 * 60000)
    seedAppointments.push({
      id: t.id,
      patient_id: t.patient_id,
      dentist_id: t.dentist_id,
      start_at: iso(start),
      end_at: iso(end),
      status: t.status,
      reason: t.reason,
      notes: '',
      created_at: iso(dayAt(-2, 9)),
      updated_at: iso(now),
    })
  }

  const TREAT_COUNT = 95
  const seedTreatments = []
  for (let i = 1; i <= TREAT_COUNT; i++) {
    const proc = pick(seedProcedures)
    const status = weightedPick(TREAT_STATUSES, [15, 25, 52, 8])
    const monthsAgo = rand(0, 10)
    const start = monthAt(monthsAgo, rand(1, 28))
    const completed = status === 'completed'
    seedTreatments.push({
      id: `t${i}`,
      patient_id: pick(patientIds),
      dentist_id: pick(dentistIds),
      procedure_id: proc.id,
      status,
      start_date: iso(start),
      end_date: completed ? iso(new Date(start.getTime() + rand(3, 45) * 86400000)) : null,
      sessions_planned: rand(1, 4),
      sessions_done: completed ? rand(1, 4) : rand(0, 2),
      cost: Number(proc.base_price) * (completed ? 1 : rand(1, 3) * 0.4),
      notes: `Tratamiento ${proc.code} — registro ${i}`,
      created_at: iso(start),
      updated_at: iso(now),
    })
  }

  const CLINICAL_COUNT = 130
  const seedClinical = []
  const titles = ['Diagnóstico', 'Evolución', 'Procedimiento realizado', 'Nota clínica', 'Control post-tratamiento']
  for (let i = 1; i <= CLINICAL_COUNT; i++) {
    const type = pick(CLINICAL_TYPES)
    const monthsAgo = rand(0, 11)
    const created = monthAt(monthsAgo, rand(1, 28), rand(8, 17))
    seedClinical.push({
      id: `c${i}`,
      patient_id: pick(patientIds),
      dentist_id: pick(dentistIds),
      type,
      title: pick(titles),
      content: `Registro clínico #${i}. ${type === 'diagnosis' ? 'Hallazgos dentro de parámetros normales.' : 'Seguimiento habitual del caso.'}`,
      diagnosis_code: type === 'diagnosis' ? `K02.${rand(0, 9)}` : null,
      procedure_id: type === 'procedure' ? pick(procedureIds) : null,
      attachment_name: null,
      created_at: iso(created),
    })
  }

  const seedOdontograms = patientIds.slice(0, 40).map((patient_id, idx) => ({
    patient_id,
    teeth: defaultTeeth(),
    updated_at: iso(monthAt(idx % 8, rand(1, 20))),
  }))

  const INV_COUNT = 78
  const seedInvoices = []
  const seedInvoiceLines = []
  const seedPayments = []
  let lineSeq = 1
  let paySeq = 1

  for (let i = 1; i <= INV_COUNT; i++) {
    const proc = pick(seedProcedures)
    const qty = rand(1, 3)
    const subtotal = Math.round(Number(proc.base_price) * qty)
    const tax = Math.round(subtotal * 0.21)
    const total = subtotal + tax
    const status = weightedPick(INV_STATUSES, INV_WEIGHTS)
    const monthsAgo = rand(0, 11)
    const issued = monthAt(monthsAgo, rand(1, 28))
    const due = new Date(issued)
    due.setDate(due.getDate() + rand(10, 30))
    let amountPaid = 0
    if (status === 'paid') amountPaid = total
    else if (status === 'partial') amountPaid = Math.round(total * rand(30, 80) / 100)

    const invId = `inv${i}`
    seedInvoices.push({
      id: invId,
      patient_id: pick(patientIds),
      status,
      issued_at: iso(issued),
      due_at: iso(due),
      subtotal,
      tax,
      total,
      amount_paid: amountPaid,
      notes: status === 'void' ? 'Anulada por error de carga' : '',
      created_at: iso(issued),
      updated_at: iso(now),
    })
    seedInvoiceLines.push({
      id: `l${lineSeq++}`,
      invoice_id: invId,
      description: proc.name,
      quantity: qty,
      unit_price: proc.base_price,
      treatment_id: i <= seedTreatments.length ? `t${i}` : null,
    })
    if (amountPaid > 0) {
      seedPayments.push({
        id: `pay${paySeq++}`,
        invoice_id: invId,
        amount: amountPaid,
        method: pick(PAY_METHODS),
        paid_at: iso(new Date(issued.getTime() + rand(1, 10) * 86400000)),
        reference: `REF-${1000 + i}`,
      })
    }
  }

  const INV_ITEM_COUNT = 52
  const seedInventory = []
  for (let i = 1; i <= INV_ITEM_COUNT; i++) {
    const base = INVENTORY_CATALOG[(i - 1) % INVENTORY_CATALOG.length]
    const variant = Math.ceil(i / INVENTORY_CATALOG.length)
    seedInventory.push({
      id: `i${i}`,
      sku: `${base.sku}-${String(i).padStart(3, '0')}`,
      name: variant > 1 ? `${base.name} (${variant})` : base.name,
      category: base.category,
      unit: base.unit,
      stock: rand(1, 80),
      min_stock: rand(4, 15),
      unit_cost: base.unit_cost + rand(-500, 2000),
      supplier: pick(SUPPLIERS),
      updated_at: iso(now),
    })
  }
  const itemIds = seedInventory.map((x) => x.id)

  const MOV_COUNT = 160
  const seedMovements = []
  const movReasons = ['Consumo diario', 'Tratamiento', 'Compra proveedor', 'Ajuste inventario', 'Reposición stock']
  for (let i = 1; i <= MOV_COUNT; i++) {
    const monthsAgo = rand(0, 11)
    seedMovements.push({
      id: `m${i}`,
      item_id: pick(itemIds),
      type: i % 4 === 0 ? 'in' : 'out',
      quantity: rand(1, 15),
      reason: pick(movReasons),
      related_treatment_id: i % 3 === 0 ? `t${rand(1, TREAT_COUNT)}` : null,
      created_at: iso(monthAt(monthsAgo, rand(1, 28))),
    })
  }

  const seedClinic = {
    id: 1,
    name: 'Consultorio Odontológico PRODENTIS',
    tax_id: '30-71555444-8',
    phone: '+54 11 4555-9090',
    email: 'contacto@prodentis.local',
    address: 'Av. del Libertador 5000, C1426 CABA',
    opening_hours: 'Lun–Vie 9:00–19:00 · Sáb 9:00–13:00',
  }

  return {
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
  }
}
