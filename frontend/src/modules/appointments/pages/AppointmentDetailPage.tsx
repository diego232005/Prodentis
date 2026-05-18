import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { InfoGrid } from '@/components/shared/InfoGrid'
import { AppointmentStatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  cancelAppointment,
  getAppointment,
  setAppointmentStatus,
  updateAppointment,
} from '@/modules/appointments/services/appointmentsService'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { ROUTES } from '@/lib/constants/routes'
import { formatDateTime } from '@/lib/formatters/date'
import { datetimeLocalToIso, isoToDatetimeLocalValue } from '@/lib/utils/datetimeLocal'
import type { AppointmentStatus } from '@/types/common'

export function AppointmentDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const patients = useAppDataStore((s) => s.patients)
  const dentists = useAppDataStore((s) => s.dentists)

  const q = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointment(id!),
    enabled: Boolean(id),
  })

  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [reschedule, setReschedule] = React.useState<{ start: string; end: string } | null>(null)

  const statusMut = useMutation({
    mutationFn: ({ id: aid, status }: { id: string; status: AppointmentStatus }) => setAppointmentStatus(aid, status),
    onSuccess: () => {
      toast.success('Estado actualizado')
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['appointment', id] })
    },
  })

  const updateMut = useMutation({
    mutationFn: updateAppointment,
    onSuccess: () => {
      toast.success('Cita reprogramada')
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['appointment', id] })
      setReschedule(null)
    },
  })

  const cancelMut = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      toast.success('Cita cancelada')
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['appointment', id] })
      setCancelOpen(false)
    },
  })

  if (q.isLoading) return <LoadingState />
  if (q.isError || !q.data) return <ErrorState message="Cita no encontrada." />

  const a = q.data
  const patient = patients.find((p) => p.id === a.patientId)
  const dentist = dentists.find((d) => d.id === a.dentistId)

  return (
    <PageContainer>
      <PageTitle
        title="Detalle de cita"
        description={formatDateTime(a.startAt)}
        actions={
          <Button variant="outline" asChild>
            <Link to={ROUTES.appointments}>Volver al listado</Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Información</h3>
          <InfoGrid
            items={[
              { label: 'Paciente', value: patient ? `${patient.firstName} ${patient.lastName}` : a.patientId },
              { label: 'Odontólogo', value: dentist?.name ?? a.dentistId },
              { label: 'Motivo', value: a.reason },
              { label: 'Estado', value: <AppointmentStatusBadge status={a.status} /> },
            ]}
          />
          <p className="mt-4 text-sm text-muted-foreground">{a.notes || 'Sin notas adicionales.'}</p>
        </div>
        <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold">Cambiar estado</h3>
          <Select
            value={a.status}
            onValueChange={(v) => id && statusMut.mutate({ id, status: v as AppointmentStatus })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="in_progress">En atención</SelectItem>
              <SelectItem value="completed">Finalizada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" onClick={() => setCancelOpen(true)}>
            Cancelar cita
          </Button>
          <div className="border-t pt-4">
            <h3 className="mb-2 text-sm font-semibold">Reprogramar</h3>
            {!reschedule ? (
              <Button variant="outline" onClick={() => setReschedule({ start: isoToDatetimeLocalValue(a.startAt), end: isoToDatetimeLocalValue(a.endAt) })}>
                Editar horario
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  type="datetime-local"
                  value={reschedule.start}
                  onChange={(e) => setReschedule((r) => (r ? { ...r, start: e.target.value } : r))}
                />
                <Input
                  type="datetime-local"
                  value={reschedule.end}
                  onChange={(e) => setReschedule((r) => (r ? { ...r, end: e.target.value } : r))}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      updateMut.mutate({
                        ...a,
                        startAt: datetimeLocalToIso(reschedule.start),
                        endAt: datetimeLocalToIso(reschedule.end),
                      })
                    }
                    disabled={updateMut.isPending}
                  >
                    Guardar horario
                  </Button>
                  <Button variant="ghost" onClick={() => setReschedule(null)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="¿Cancelar esta cita?"
        description="El estado pasará a cancelada. Podrá revertirlo manualmente si fue un error."
        confirmLabel="Sí, cancelar"
        variant="destructive"
        onConfirm={() => id && cancelMut.mutate(id)}
      />
    </PageContainer>
  )
}
