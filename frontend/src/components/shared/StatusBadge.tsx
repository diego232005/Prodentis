import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { appointmentLabels } from '@/lib/constants/appointmentStatus'
import type { AppointmentStatus, InvoiceStatus, PatientStatus, TreatmentStatus } from '@/types/common'


const invoiceLabels: Record<InvoiceStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  void: 'Anulada',
  partial: 'Parcial',
}

const patientLabels: Record<PatientStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  archived: 'Archivado',
}

const treatmentLabels: Record<TreatmentStatus, string> = {
  planned: 'Planificado',
  in_progress: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

function appointmentVariant(s: AppointmentStatus): React.ComponentProps<typeof Badge>['variant'] {
  if (s === 'cancelled' || s === 'no_show') return 'destructive'
  if (s === 'waiting') return 'warning'
  if (s === 'completed') return 'success'
  if (s === 'in_progress') return 'warning'
  if (s === 'confirmed') return 'default'
  return 'secondary'
}

function invoiceVariant(s: InvoiceStatus): React.ComponentProps<typeof Badge>['variant'] {
  if (s === 'paid') return 'success'
  if (s === 'void') return 'destructive'
  if (s === 'partial') return 'warning'
  return 'secondary'
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant={appointmentVariant(status)}>{appointmentLabels[status]}</Badge>
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant={invoiceVariant(status)}>{invoiceLabels[status]}</Badge>
}

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
  return (
    <Badge variant={status === 'active' ? 'success' : 'muted'}>{patientLabels[status]}</Badge>
  )
}

export function TreatmentStatusBadge({ status }: { status: TreatmentStatus }) {
  const v =
    status === 'completed' ? 'success' : status === 'cancelled' ? 'destructive' : status === 'in_progress' ? 'warning' : 'secondary'
  return <Badge variant={v}>{treatmentLabels[status]}</Badge>
}
