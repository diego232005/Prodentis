import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, isSameDay, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { setAppointmentStatus } from '@/modules/appointments/services/appointmentsService'
import type { AppointmentStatus } from '@/types/common'
import type { Appointment } from '@/types/domain'

interface ReceptionBoardProps {
  appointments: Appointment[]
  getPatientName: (patientId: string) => string
  getDentistName?: (dentistId: string) => string
  getChairName?: (chairId?: string) => string
  date?: Date
  readOnly?: boolean
  onSelectAppointment?: (id: string) => void
}

const COLUMNS: { key: string; title: string; statuses: AppointmentStatus[]; tone: string }[] = [
  { key: 'scheduled', title: 'Agendados', statuses: ['pending', 'confirmed'], tone: 'border-t-slate-400' },
  { key: 'waiting', title: 'Sala de espera', statuses: ['waiting'], tone: 'border-t-amber-400' },
  { key: 'in_progress', title: 'En atención', statuses: ['in_progress'], tone: 'border-t-sky-500' },
  { key: 'closed', title: 'Cerrados', statuses: ['completed', 'no_show', 'cancelled'], tone: 'border-t-emerald-500' },
]

const CLOSED_LABEL: Partial<Record<AppointmentStatus, string>> = {
  completed: 'Finalizada',
  no_show: 'No asistió',
  cancelled: 'Cancelada',
}

export function ReceptionBoard({
  appointments,
  getPatientName,
  getDentistName,
  getChairName,
  date,
  readOnly,
  onSelectAppointment,
}: ReceptionBoardProps) {
  const qc = useQueryClient()
  const day = date ?? new Date()
  const today = React.useMemo(
    () =>
      appointments
        .filter((a) => isSameDay(parseISO(a.startAt), day))
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [appointments, day],
  )

  const mut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => setAppointmentStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => toast.error('No se pudo actualizar la cita'),
  })

  const act = (a: Appointment) => {
    const btn = (label: string, status: AppointmentStatus, variant: 'default' | 'outline' | 'ghost' = 'default') => (
      <Button
        key={status}
        type="button"
        size="sm"
        variant={variant}
        className="h-7 px-2 text-xs"
        disabled={mut.isPending || readOnly}
        onClick={() => mut.mutate({ id: a.id, status })}
      >
        {label}
      </Button>
    )
    if (a.status === 'pending' || a.status === 'confirmed')
      return [btn('Llegó', 'waiting'), btn('No asistió', 'no_show', 'ghost')]
    if (a.status === 'waiting') return [btn('Pasar a consultorio', 'in_progress')]
    if (a.status === 'in_progress') return [btn('Finalizar', 'completed')]
    return []
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = today.filter((a) => col.statuses.includes(a.status))
        return (
          <div key={col.key} className={cn('rounded-lg border border-t-4 bg-card', col.tone)}>
            <div className="flex items-center justify-between px-3 py-2">
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <span className="rounded-full bg-teal-50 px-2 text-xs font-medium text-teal-800">{items.length}</span>
            </div>
            <ul className="max-h-[420px] space-y-2 overflow-y-auto px-2 pb-2">
              {items.length === 0 ? <li className="px-1 py-3 text-center text-xs text-muted-foreground">Sin citas</li> : null}
              {items.map((a) => {
                const waited =
                  a.status === 'waiting' && a.arrivedAt
                    ? Math.max(0, Math.round((Date.now() - parseISO(a.arrivedAt).getTime()) / 60000))
                    : null
                return (
                  <li key={a.id} className="space-y-1.5 rounded-md border bg-background p-2 text-xs">
                    <button type="button" className="block w-full text-left" onClick={() => onSelectAppointment?.(a.id)}>
                      <p className="text-sm font-medium leading-tight">{getPatientName(a.patientId)}</p>
                      <p className="text-muted-foreground">
                        {format(parseISO(a.startAt), 'HH:mm')}–{format(parseISO(a.endAt), 'HH:mm')}
                        {getDentistName ? ` · ${getDentistName(a.dentistId)}` : ''}
                        {getChairName && a.chairId ? ` · ${getChairName(a.chairId)}` : ''}
                      </p>
                      <p className="line-clamp-1 text-muted-foreground">{a.reason}</p>
                    </button>
                    {waited !== null ? <p className="font-medium text-amber-700">Esperando {waited} min</p> : null}
                    {col.key === 'closed' ? (
                      <p className="font-medium text-muted-foreground">{CLOSED_LABEL[a.status]}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">{act(a)}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
