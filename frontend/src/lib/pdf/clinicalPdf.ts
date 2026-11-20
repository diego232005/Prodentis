import { jsPDF } from 'jspdf'
import type {
  ClinicSettings,
  ClinicalEntry,
  Consent,
  Dentist,
  Invoice,
  OdontogramState,
  Patient,
  Payment,
  Prescription,
} from '@/types/domain'

const TEAL: [number, number, number] = [13, 148, 136]
const MARGIN = 15
const PAGE_W = 210
const PAGE_H = 297
const CONTENT_W = PAGE_W - MARGIN * 2

const money = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const dt = (iso?: string) => (iso ? new Date(iso).toLocaleString('es-AR') : '—')
const d = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('es-AR') : '—')
const fullName = (p: Patient) => `${p.firstName} ${p.lastName}`
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

class Doc {
  readonly pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  y = MARGIN

  constructor(clinic: ClinicSettings | undefined, title: string) {
    const p = this.pdf
    p.setFillColor(...TEAL)
    p.rect(0, 0, PAGE_W, 24, 'F')
    p.setTextColor(255, 255, 255)
    p.setFont('helvetica', 'bold')
    p.setFontSize(16)
    p.text(clinic?.name ?? 'PRODENTIS', MARGIN, 11)
    p.setFont('helvetica', 'normal')
    p.setFontSize(9)
    p.text([clinic?.address, clinic?.phone].filter(Boolean).join(' · '), MARGIN, 17)
    p.setFontSize(12)
    p.setFont('helvetica', 'bold')
    p.text(title, PAGE_W - MARGIN, 11, { align: 'right' })
    p.setTextColor(30, 41, 59)
    this.y = 34
  }

  private ensure(h: number) {
    if (this.y + h > PAGE_H - MARGIN) {
      this.pdf.addPage()
      this.y = MARGIN
    }
  }

  heading(text: string) {
    this.ensure(10)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(11)
    this.pdf.setTextColor(...TEAL)
    this.pdf.text(text, MARGIN, this.y)
    this.pdf.setDrawColor(...TEAL)
    this.pdf.line(MARGIN, this.y + 1.5, PAGE_W - MARGIN, this.y + 1.5)
    this.pdf.setTextColor(30, 41, 59)
    this.y += 7
  }

  text(text: string, opts: { bold?: boolean; size?: number; color?: [number, number, number]; indent?: number } = {}) {
    const p = this.pdf
    p.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    p.setFontSize(opts.size ?? 10)
    if (opts.color) p.setTextColor(...opts.color)
    const x = MARGIN + (opts.indent ?? 0)
    const lines = p.splitTextToSize(text || '—', CONTENT_W - (opts.indent ?? 0)) as string[]
    const lh = (opts.size ?? 10) * 0.45
    for (const line of lines) {
      this.ensure(lh + 1)
      p.text(line, x, this.y)
      this.y += lh
    }
    this.y += 1.5
    p.setTextColor(30, 41, 59)
  }

  kv(label: string, value: string) {
    this.ensure(6)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(10)
    this.pdf.text(`${label}:`, MARGIN, this.y)
    this.pdf.setFont('helvetica', 'normal')
    const lines = this.pdf.splitTextToSize(value || '—', CONTENT_W - 40) as string[]
    lines.forEach((l, i) => {
      if (i > 0) this.ensure(5)
      this.pdf.text(l, MARGIN + 40, this.y)
      if (i < lines.length - 1) this.y += 5
    })
    this.y += 6
  }

  gap(h = 4) {
    this.y += h
  }

  image(dataUrl: string, w: number, h: number) {
    this.ensure(h + 2)
    try {
      this.pdf.addImage(dataUrl, 'PNG', MARGIN, this.y, w, h)
    } catch {
      this.text('[firma no disponible]')
    }
    this.y += h + 2
  }

  footer() {
    const n = this.pdf.getNumberOfPages()
    for (let i = 1; i <= n; i++) {
      this.pdf.setPage(i)
      this.pdf.setFontSize(8)
      this.pdf.setTextColor(120, 130, 140)
      this.pdf.text(`Generado ${dt(new Date().toISOString())} — Página ${i}/${n}`, PAGE_W / 2, PAGE_H - 7, {
        align: 'center',
      })
    }
  }

  save(filename: string) {
    this.footer()
    this.pdf.save(filename)
  }
}

function patientBlock(doc: Doc, p: Patient) {
  doc.heading('Paciente')
  doc.kv('Nombre', fullName(p))
  doc.kv('Documento', p.documentId)
  doc.kv('Nacimiento', d(p.birthDate))
  doc.kv('Teléfono', p.phone)
  if (p.allergies) doc.kv('ALERGIAS', p.allergies)
}

export interface ClinicalHistoryPdfInput {
  clinic?: ClinicSettings
  patient: Patient
  entries: ClinicalEntry[]
  dentists: Dentist[]
  odontogram?: OdontogramState | null
}

export function downloadClinicalHistoryPdf({ clinic, patient, entries, dentists, odontogram }: ClinicalHistoryPdfInput) {
  const doc = new Doc(clinic, 'Historia clínica')
  patientBlock(doc, patient)
  doc.kv('Antecedentes', [patient.chronicDiseases, patient.medicalNotes].filter(Boolean).join(' · '))
  doc.kv('Medicación', patient.currentMedications ?? '')
  doc.gap()

  if (odontogram) {
    const marked = odontogram.teeth.filter(
      (t) => t.status !== 'healthy' || Object.values(t.surfaces ?? {}).some((s) => s && s !== 'healthy'),
    )
    doc.heading('Odontograma')
    doc.text(
      marked.length
        ? marked
            .map((t) => {
              const surf = Object.entries(t.surfaces ?? {})
                .filter(([, s]) => s && s !== 'healthy')
                .map(([k, s]) => `${k}:${s}`)
                .join(',')
              return `${t.toothId} ${t.status}${surf ? ` (${surf})` : ''}`
            })
            .join(' | ')
        : 'Sin hallazgos registrados.',
    )
    doc.gap()
  }

  doc.heading('Evolución clínica')
  if (entries.length === 0) doc.text('Sin registros.')
  for (const e of entries) {
    const dentist = dentists.find((x) => x.id === e.dentistId)?.name ?? ''
    doc.text(`${dt(e.createdAt)} — ${e.title}${dentist ? ` (${dentist})` : ''}`, { bold: true })
    if (e.chiefComplaint) doc.text(`Motivo: ${e.chiefComplaint}`, { indent: 3 })
    if (e.currentIllness) doc.text(`Enfermedad actual: ${e.currentIllness}`, { indent: 3 })
    if (e.physicalExam) doc.text(`Examen: ${e.physicalExam}`, { indent: 3 })
    if (e.diagnosis || e.diagnosisCode) doc.text(`Diagnóstico: ${[e.diagnosis, e.diagnosisCode].filter(Boolean).join(' · ')}`, { indent: 3 })
    if (e.treatmentPerformed) doc.text(`Tratamiento: ${e.treatmentPerformed}`, { indent: 3 })
    if (e.indications) doc.text(`Indicaciones: ${e.indications}`, { indent: 3 })
    if (e.content) doc.text(e.content, { indent: 3 })
    if (e.nextVisit) doc.text(`Próxima cita: ${d(e.nextVisit)}`, { indent: 3 })
    doc.gap(2)
  }
  doc.save(`historia-clinica-${slug(fullName(patient))}.pdf`)
}

export interface PrescriptionPdfInput {
  clinic?: ClinicSettings
  patient: Patient
  dentist?: Dentist
  prescription: Prescription
}

export function downloadPrescriptionPdf({ clinic, patient, dentist, prescription }: PrescriptionPdfInput) {
  const doc = new Doc(clinic, 'Receta')
  patientBlock(doc, patient)
  doc.kv('Fecha', dt(prescription.createdAt))
  if (prescription.diagnosis) doc.kv('Diagnóstico', prescription.diagnosis)
  doc.gap()
  doc.heading('Rp/')
  prescription.items.forEach((it, i) => {
    doc.text(`${i + 1}. ${it.name}`, { bold: true })
    doc.text(
      [it.dose && `Dosis: ${it.dose}`, it.frequency && `Frecuencia: ${it.frequency}`, it.duration && `Duración: ${it.duration}`]
        .filter(Boolean)
        .join(' · '),
      { indent: 4 },
    )
    if (it.notes) doc.text(it.notes, { indent: 4 })
  })
  if (prescription.indications) {
    doc.gap()
    doc.heading('Indicaciones')
    doc.text(prescription.indications)
  }
  doc.gap(14)
  doc.text('______________________________', { indent: 110 })
  doc.text(dentist ? `${dentist.name} — ${dentist.licenseNumber}` : 'Odontólogo', { indent: 110, size: 9 })
  doc.save(`receta-${slug(fullName(patient))}-${prescription.id}.pdf`)
}

export interface ConsentPdfInput {
  clinic?: ClinicSettings
  patient: Patient
  consent: Consent
}

export function downloadConsentPdf({ clinic, patient, consent }: ConsentPdfInput) {
  const doc = new Doc(clinic, 'Consentimiento informado')
  patientBlock(doc, patient)
  doc.gap()
  doc.heading(consent.title)
  doc.text(consent.body)
  doc.gap(8)
  doc.kv('Firmado por', consent.signedByName ?? fullName(patient))
  doc.kv('Fecha', dt(consent.signedAt ?? consent.createdAt))
  if (consent.signatureDataUrl) doc.image(consent.signatureDataUrl, 70, 28)
  else doc.text('Sin firma registrada.')
  doc.save(`consentimiento-${slug(fullName(patient))}-${consent.id}.pdf`)
}

export interface CashReceiptPdfInput {
  clinic?: ClinicSettings
  patient?: Patient
  invoice: Invoice
  payment: Payment
}

export function downloadCashReceiptPdf({ clinic, patient, invoice, payment }: CashReceiptPdfInput) {
  const doc = new Doc(clinic, 'Recibo de pago')
  doc.heading('Datos del recibo')
  doc.kv('Recibo N°', payment.id)
  doc.kv('Factura', invoice.id)
  doc.kv('Fecha de pago', dt(payment.paidAt))
  doc.kv('Paciente', patient ? fullName(patient) : invoice.patientId)
  if (patient) doc.kv('Documento', patient.documentId)
  doc.kv('Medio', { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }[payment.method])
  if (payment.reference) doc.kv('Referencia', payment.reference)
  doc.gap()
  doc.heading('Detalle')
  invoice.lines.forEach((l) => doc.text(`${l.description} — ${l.quantity} x ${money(l.unitPrice)} = ${money(l.quantity * l.unitPrice)}`))
  doc.gap()
  doc.kv('Total factura', money(invoice.total))
  doc.kv('Monto abonado', money(payment.amount))
  doc.kv('Saldo', money(Math.max(0, invoice.total - invoice.amountPaid)))
  doc.save(`recibo-${payment.id}.pdf`)
}
