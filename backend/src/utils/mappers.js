function rowToPatient(r) {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    documentId: r.document_id,
    birthDate: r.birth_date instanceof Date ? r.birth_date.toISOString().slice(0, 10) : r.birth_date,
    phone: r.phone,
    email: r.email,
    address: r.address,
    status: r.status,
    allergies: r.allergies ?? '',
    medicalNotes: r.medical_notes ?? '',
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
    updatedAt: r.updated_at?.toISOString?.() ?? r.updated_at,
  }
}

function rowToAppointment(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    dentistId: r.dentist_id,
    startAt: r.start_at?.toISOString?.() ?? r.start_at,
    endAt: r.end_at?.toISOString?.() ?? r.end_at,
    status: r.status,
    reason: r.reason ?? '',
    notes: r.notes ?? '',
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
    updatedAt: r.updated_at?.toISOString?.() ?? r.updated_at,
  }
}

function rowToInventory(r) {
  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    category: r.category,
    unit: r.unit,
    stock: Number(r.stock),
    minStock: Number(r.min_stock),
    unitCost: Number(r.unit_cost),
    supplier: r.supplier,
    updatedAt: r.updated_at?.toISOString?.() ?? r.updated_at,
  }
}

function rowToMovement(r) {
  return {
    id: r.id,
    itemId: r.item_id,
    type: r.type,
    quantity: Number(r.quantity),
    reason: r.reason,
    relatedTreatmentId: r.related_treatment_id ?? undefined,
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
  }
}

function rowToTreatment(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    dentistId: r.dentist_id,
    procedureId: r.procedure_id,
    status: r.status,
    startDate: r.start_date instanceof Date ? r.start_date.toISOString() : r.start_date,
    endDate: r.end_date ? (r.end_date instanceof Date ? r.end_date.toISOString() : r.end_date) : undefined,
    sessionsPlanned: Number(r.sessions_planned),
    sessionsDone: Number(r.sessions_done),
    cost: Number(r.cost),
    notes: r.notes ?? '',
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
    updatedAt: r.updated_at?.toISOString?.() ?? r.updated_at,
  }
}

function rowToInvoice(r, lines = []) {
  return {
    id: r.id,
    patientId: r.patient_id,
    status: r.status,
    issuedAt: r.issued_at?.toISOString?.() ?? r.issued_at,
    dueAt: r.due_at?.toISOString?.() ?? r.due_at,
    lines,
    subtotal: Number(r.subtotal),
    tax: Number(r.tax),
    total: Number(r.total),
    amountPaid: Number(r.amount_paid),
    notes: r.notes ?? '',
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
    updatedAt: r.updated_at?.toISOString?.() ?? r.updated_at,
  }
}

function rowToInvoiceLine(r) {
  return {
    id: r.id,
    description: r.description,
    quantity: Number(r.quantity),
    unitPrice: Number(r.unit_price),
    treatmentId: r.treatment_id ?? undefined,
  }
}

function rowToPayment(r) {
  return {
    id: r.id,
    invoiceId: r.invoice_id,
    amount: Number(r.amount),
    method: r.method,
    paidAt: r.paid_at?.toISOString?.() ?? r.paid_at,
    reference: r.reference ?? '',
  }
}

function rowToClinical(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    dentistId: r.dentist_id,
    type: r.type,
    title: r.title,
    content: r.content,
    diagnosisCode: r.diagnosis_code ?? undefined,
    procedureId: r.procedure_id ?? undefined,
    attachmentName: r.attachment_name ?? undefined,
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
  }
}

function rowToDentist(r) {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    specialty: r.specialty,
    licenseNumber: r.license_number,
  }
}

function rowToProcedure(r) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description,
    basePrice: Number(r.base_price),
    durationMinutes: Number(r.duration_minutes),
  }
}

function rowToUser(r) {
  return {
    id: r.id,
    email: r.email,
    password: r.password,
    name: r.name,
    role: r.role,
    avatarUrl: r.avatar_url ?? undefined,
  }
}

export const mappers = {
  patient: rowToPatient,
  appointment: rowToAppointment,
  inventory: rowToInventory,
  movement: rowToMovement,
  treatment: rowToTreatment,
  invoice: rowToInvoice,
  invoiceLine: rowToInvoiceLine,
  payment: rowToPayment,
  clinical: rowToClinical,
  dentist: rowToDentist,
  procedure: rowToProcedure,
  user: rowToUser,
}
