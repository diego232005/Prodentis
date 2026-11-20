const iso = (v) => v?.toISOString?.() ?? v
const isoOpt = (v) => (v == null ? undefined : iso(v))
const dateStr = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v)
const timeStr = (v) => (typeof v === 'string' ? v.slice(0, 5) : v)

function rowToPatient(r) {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    documentId: r.document_id,
    birthDate: dateStr(r.birth_date),
    phone: r.phone,
    email: r.email,
    address: r.address,
    status: r.status,
    allergies: r.allergies ?? '',
    medicalNotes: r.medical_notes ?? '',
    bloodType: r.blood_type ?? '',
    systemicConditions: r.systemic_conditions ?? '',
    currentMedications: r.current_medications ?? '',
    emergencyContactName: r.emergency_contact_name ?? '',
    emergencyContactPhone: r.emergency_contact_phone ?? '',
    isSmoker: Boolean(r.is_smoker),
    isPregnant: Boolean(r.is_pregnant),
    takesAnticoagulants: Boolean(r.takes_anticoagulants),
    anamnesisNotes: r.anamnesis_notes ?? '',
    anamnesisUpdatedAt: isoOpt(r.anamnesis_updated_at),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  }
}

function rowToAppointment(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    dentistId: r.dentist_id,
    chairId: r.chair_id ?? undefined,
    procedureId: r.procedure_id ?? undefined,
    startAt: iso(r.start_at),
    endAt: iso(r.end_at),
    status: r.status,
    reason: r.reason ?? '',
    notes: r.notes ?? '',
    cancelReason: r.cancel_reason ?? '',
    cancelledAt: isoOpt(r.cancelled_at),
    waitingSince: isoOpt(r.waiting_since),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
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
    expiresAt: r.expires_at ? dateStr(r.expires_at) : undefined,
    lotNumber: r.lot_number ?? '',
    updatedAt: iso(r.updated_at),
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
    createdAt: iso(r.created_at),
  }
}

function rowToTreatment(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    dentistId: r.dentist_id,
    procedureId: r.procedure_id,
    status: r.status,
    startDate: iso(r.start_date),
    endDate: isoOpt(r.end_date),
    sessionsPlanned: Number(r.sessions_planned),
    sessionsDone: Number(r.sessions_done),
    cost: Number(r.cost),
    notes: r.notes ?? '',
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  }
}

function rowToInvoice(r, lines = []) {
  return {
    id: r.id,
    patientId: r.patient_id,
    status: r.status,
    issuedAt: iso(r.issued_at),
    dueAt: iso(r.due_at),
    lines,
    subtotal: Number(r.subtotal),
    tax: Number(r.tax),
    total: Number(r.total),
    amountPaid: Number(r.amount_paid),
    notes: r.notes ?? '',
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
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
    paidAt: iso(r.paid_at),
    reference: r.reference ?? '',
  }
}

function rowToClinical(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    dentistId: r.dentist_id,
    appointmentId: r.appointment_id ?? undefined,
    toothId: r.tooth_id ?? undefined,
    type: r.type,
    title: r.title,
    content: r.content,
    diagnosisCode: r.diagnosis_code ?? undefined,
    procedureId: r.procedure_id ?? undefined,
    attachmentName: r.attachment_name ?? undefined,
    createdBy: r.created_by ?? undefined,
    createdAt: iso(r.created_at),
    updatedAt: isoOpt(r.updated_at),
    updatedBy: r.updated_by ?? undefined,
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

function rowToChair(r) {
  return { id: r.id, name: r.name, room: r.room ?? '', active: r.active, sortOrder: Number(r.sort_order) }
}

function rowToAvailability(r) {
  return {
    id: r.id,
    dentistId: r.dentist_id,
    weekday: Number(r.weekday),
    startTime: timeStr(r.start_time),
    endTime: timeStr(r.end_time),
    active: r.active,
  }
}

function rowToBlock(r) {
  return {
    id: r.id,
    dentistId: r.dentist_id,
    startAt: iso(r.start_at),
    endAt: iso(r.end_at),
    reason: r.reason ?? '',
    createdAt: iso(r.created_at),
  }
}

function rowToConsentTemplate(r) {
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    category: r.category ?? '',
    body: r.body,
    active: r.active,
    updatedAt: iso(r.updated_at),
  }
}

function rowToConsent(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    dentistId: r.dentist_id ?? undefined,
    templateId: r.template_id ?? undefined,
    appointmentId: r.appointment_id ?? undefined,
    title: r.title,
    body: r.body,
    status: r.status,
    signedByName: r.signed_by_name ?? undefined,
    signedAt: isoOpt(r.signed_at),
    hasSignature: r.has_signature ?? Boolean(r.signature_data),
    signatureData: r.signature_data ?? undefined,
    createdBy: r.created_by ?? undefined,
    createdAt: iso(r.created_at),
  }
}

function rowToMedication(r) {
  return {
    id: r.id,
    name: r.name,
    presentation: r.presentation ?? '',
    defaultDosage: r.default_dosage ?? '',
    category: r.category ?? '',
    active: r.active,
  }
}

function rowToPrescription(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    dentistId: r.dentist_id,
    appointmentId: r.appointment_id ?? undefined,
    diagnosis: r.diagnosis ?? '',
    items: r.items ?? [],
    notes: r.notes ?? '',
    createdAt: iso(r.created_at),
  }
}

/** Metadatos del archivo; el contenido (data_url) se sirve por endpoint dedicado. */
function rowToDiagnostic(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    dentistId: r.dentist_id ?? undefined,
    kind: r.kind,
    name: r.name,
    mimeType: r.mime_type,
    sizeBytes: Number(r.size_bytes),
    toothId: r.tooth_id ?? undefined,
    notes: r.notes ?? '',
    dataUrl: r.data_url ?? undefined,
    createdBy: r.created_by ?? undefined,
    createdAt: iso(r.created_at),
  }
}

function rowToPlanItem(r) {
  return {
    id: r.id,
    planId: r.plan_id,
    procedureId: r.procedure_id ?? undefined,
    description: r.description,
    toothId: r.tooth_id ?? undefined,
    quantity: Number(r.quantity),
    unitPrice: Number(r.unit_price),
    status: r.status,
    sortOrder: Number(r.sort_order),
  }
}

function rowToTreatmentPlan(r, items = []) {
  return {
    id: r.id,
    patientId: r.patient_id,
    dentistId: r.dentist_id,
    title: r.title,
    status: r.status,
    discount: Number(r.discount),
    total: Number(r.total),
    notes: r.notes ?? '',
    approvedAt: isoOpt(r.approved_at),
    items,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  }
}

function rowToCashClosure(r) {
  return {
    id: r.id,
    closureDate: dateStr(r.closure_date),
    expectedCash: Number(r.expected_cash),
    expectedCard: Number(r.expected_card),
    expectedTransfer: Number(r.expected_transfer),
    countedCash: Number(r.counted_cash),
    difference: Number(r.difference),
    paymentsCount: Number(r.payments_count),
    notes: r.notes ?? '',
    closedBy: r.closed_by ?? undefined,
    closedAt: iso(r.closed_at),
  }
}

function rowToPeriodontogram(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    dentistId: r.dentist_id ?? undefined,
    data: r.data ?? {},
    notes: r.notes ?? '',
    createdAt: iso(r.created_at),
  }
}

function rowToSnapshot(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    teeth: r.teeth ?? [],
    note: r.note ?? '',
    createdBy: r.created_by ?? undefined,
    createdAt: iso(r.created_at),
  }
}

function rowToOdontogram(r) {
  return { patientId: r.patient_id, teeth: r.teeth ?? [], updatedAt: iso(r.updated_at) }
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
  chair: rowToChair,
  availability: rowToAvailability,
  block: rowToBlock,
  consentTemplate: rowToConsentTemplate,
  consent: rowToConsent,
  medication: rowToMedication,
  prescription: rowToPrescription,
  diagnostic: rowToDiagnostic,
  planItem: rowToPlanItem,
  treatmentPlan: rowToTreatmentPlan,
  cashClosure: rowToCashClosure,
  periodontogram: rowToPeriodontogram,
  snapshot: rowToSnapshot,
  odontogram: rowToOdontogram,
}
