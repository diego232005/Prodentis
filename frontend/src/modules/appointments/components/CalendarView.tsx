import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { appointmentLabels } from '@/lib/constants/appointmentStatus'
import { updateAppointment } from '@/modules/appointments/services/appointmentsService'
import type { AppointmentStatus } from '@/types/common'
import type { Appointment, Dentist, DentistBlock } from '@/types/domain'

export type CalendarViewMode = 'day' | 'week' | 'month' | 'doctor'

const START_HOUR = 7
const END_HOUR = 21
const HOUR_PX = 56
const SNAP_MIN = 15
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending: 'border-slate-300 bg-slate-100 text-slate-800',
  confirmed: 'border-teal-400 bg-teal-100 text-teal-900',
  waiting: 'border-amber-400 bg-amber-100 text-amber-900',
  in_progress: 'border-sky-400 bg-sky-100 text-sky-900',
  completed: 'border-emerald-400 bg-emerald-100 text-emerald-900',
  cancelled: 'border-red-300 bg-red-50 text-red-700 line-through opacity-70',
  no_show: 'border-rose-300 bg-rose-50 text-rose-700 opacity-70',
}

const VIEW_LABELS: Record<CalendarViewMode, string> = { day: 'Día', week: 'Semana', month: 'Mes', doctor: 'Por doctor' }

interface CalendarViewProps {
  appointments: Appointment[]
  getPatientName: (patientId: string) => string
  dentists?: Dentist[]
  blocks?: DentistBlock[]
  date: Date
  onDateChange: (d: Date) => void
  view: CalendarViewMode
  onViewChange: (v: CalendarViewMode) => void
  onSelectAppointment?: (id: string) => void
}

interface Column {
  key: string
  label: string
  sub?: string
  date: Date
  dentistId?: string
  items: Appointment[]
  blocks: DentistBlock[]
}

function layoutLanes(items: Appointment[]) {
  const sorted = [...items].sort((a, b) => a.startAt.localeCompare(b.startAt))
  const out: { apt: Appointment; lane: number; lanes: number }[] = []
  let cluster: typeof out = []
  let clusterEnd = 0
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1))
    cluster.forEach((c) => (c.lanes = lanes))
    out.push(...cluster)
    cluster = []
  }
  for (const apt of sorted) {
    const s = parseISO(apt.startAt).getTime()
    const e = parseISO(apt.endAt).getTime()
    if (cluster.length && s >= clusterEnd) flush()
    const used = new Set(
      cluster.filter((c) => parseISO(c.apt.endAt).getTime() > s).map((c) => c.lane),
    )
    let lane = 0
    while (used.has(lane)) lane++
    cluster.push({ apt, lane, lanes: 1 })
    clusterEnd = Math.max(clusterEnd, e)
  }
  flush()
  return out
}

export function CalendarView({
  appointments,
  getPatientName,
  dentists = [],
  blocks = [],
  date,
  onDateChange,
  view,
  onViewChange,
  onSelectAppointment,
}: CalendarViewProps) {
  const qc = useQueryClient()
  const [dragId, setDragId] = React.useState<string | null>(null)

  const move = useMutation({
    mutationFn: updateAppointment,
    onSuccess: () => {
      toast.success('Cita reprogramada')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: () => toast.error('No se pudo reprogramar la cita'),
  })

  const reschedule = (id: string, newStart: Date, dentistId?: string) => {
    const apt = appointments.find((a) => a.id === id)
    if (!apt) return
    const duration = parseISO(apt.endAt).getTime() - parseISO(apt.startAt).getTime()
    const start = newStart.toISOString()
    const end = new Date(newStart.getTime() + duration).toISOString()
    if (start === apt.startAt && (!dentistId || dentistId === apt.dentistId)) return
    move.mutate({ ...apt, startAt: start, endAt: end, dentistId: dentistId ?? apt.dentistId })
  }

  const dentistName = (id: string) => dentists.find((d) => d.id === id)?.name ?? id

  const weekDays = eachDayOfInterval({
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  })

  const dayItems = (d: Date) => appointments.filter((a) => isSameDay(parseISO(a.startAt), d))

  const columns: Column[] =
    view === 'day'
      ? [{ key: 'd', label: format(date, 'EEEE d', { locale: es }), date, items: dayItems(date), blocks: [] }]
      : view === 'week'
        ? weekDays.map((d) => ({
            key: d.toISOString(),
            label: format(d, 'EEE d', { locale: es }),
            date: d,
            items: dayItems(d),
            blocks: [],
          }))
        : view === 'doctor'
          ? dentists.map((dn) => ({
              key: dn.id,
              label: dn.name,
              sub: dn.specialty,
              date,
              dentistId: dn.id,
              items: dayItems(date).filter((a) => a.dentistId === dn.id),
              blocks: blocks.filter((b) => b.dentistId === dn.id && isSameDay(parseISO(b.startAt), date)),
            }))
          : []

  function step(dir: 1 | -1) {
    if (view === 'month') onDateChange(addMonths(date, dir))
    else if (view === 'week') onDateChange(addWeeks(date, dir))
    else onDateChange(addDays(date, dir))
  }

  const title =
    view === 'month'
      ? format(date, 'MMMM yyyy', { locale: es })
      : view === 'week'
        ? `${format(weekDays[0], 'd MMM', { locale: es })} – ${format(weekDays[6], 'd MMM yyyy', { locale: es })}`
        : format(date, "EEEE d 'de' MMMM yyyy", { locale: es })

  function onColumnDrop(e: React.DragEvent<HTMLDivElement>, col: Column) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || dragId
    setDragId(null)
    if (!id) return
    const rect = e.currentTarget.getBoundingClientRect()
    const minutes = ((e.clientY - rect.top) / HOUR_PX) * 60
    const snapped = Math.max(0, Math.round(minutes / SNAP_MIN) * SNAP_MIN)
    const start = new Date(startOfDay(col.date).getTime() + (START_HOUR * 60 + snapped) * 60000)
    reschedule(id, start, col.dentistId)
  }

  const dragProps = (a: Appointment) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', a.id)
      e.dataTransfer.effectAllowed = 'move'
      setDragId(a.id)
    },
    onDragEnd: () => setDragId(null),
  })

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-1">
          <Button type="button" size="sm" variant="outline" onClick={() => step(-1)}>
            ←
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onDateChange(new Date())}>
            Hoy
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => step(1)}>
            →
          </Button>
        </div>
        <p className="text-sm font-semibold capitalize">{title}</p>
        <div className="inline-flex rounded-md border p-0.5 text-xs">
          {(Object.keys(VIEW_LABELS) as CalendarViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              className={cn(
                'rounded px-3 py-1 font-medium transition-colors',
                view === v ? 'bg-primary text-primary-foreground' : 'hover:bg-teal-50',
              )}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' ? (
        <MonthGrid
          date={date}
          appointments={appointments}
          getPatientName={getPatientName}
          onSelectAppointment={onSelectAppointment}
          dragProps={dragProps}
          onDropDay={(id, day) => {
            const apt = appointments.find((a) => a.id === id)
            if (!apt) return
            const old = parseISO(apt.startAt)
            const next = new Date(day)
            next.setHours(old.getHours(), old.getMinutes(), 0, 0)
            reschedule(id, next)
          }}
        />
      ) : columns.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">No hay odontólogos configurados.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex min-w-[640px]">
            <div className="w-12 shrink-0 border-r">
              <div className="h-10 border-b" />
              {HOURS.map((h) => (
                <div key={h} style={{ height: HOUR_PX }} className="border-b pr-1 text-right text-[10px] text-muted-foreground">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            {columns.map((col) => (
              <div key={col.key} className="min-w-0 flex-1 border-r last:border-r-0">
                <div className="flex h-10 flex-col items-center justify-center border-b bg-teal-50/60 px-1 text-center">
                  <span className={cn('truncate text-xs font-semibold capitalize', isSameDay(col.date, new Date()) && 'text-primary')}>
                    {col.label}
                  </span>
                  {col.sub ? <span className="truncate text-[10px] text-muted-foreground">{col.sub}</span> : null}
                </div>
                <div
                  className={cn('relative', dragId && 'bg-teal-50/30')}
                  style={{ height: HOURS.length * HOUR_PX }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onColumnDrop(e, col)}
                >
                  {HOURS.map((h, i) => (
                    <div key={h} style={{ top: i * HOUR_PX, height: HOUR_PX }} className="pointer-events-none absolute inset-x-0 border-b border-dashed" />
                  ))}
                  {col.blocks.map((b) => {
                    const s = parseISO(b.startAt)
                    const e = parseISO(b.endAt)
                    const top = ((s.getHours() * 60 + s.getMinutes() - START_HOUR * 60) / 60) * HOUR_PX
                    const h = ((e.getTime() - s.getTime()) / 3600000) * HOUR_PX
                    return (
                      <div
                        key={b.id}
                        title={b.reason}
                        style={{ top, height: h }}
                        className="pointer-events-none absolute inset-x-0 bg-[repeating-linear-gradient(45deg,#e2e8f0,#e2e8f0_6px,#f1f5f9_6px,#f1f5f9_12px)] px-1 text-[10px] text-slate-500"
                      >
                        {b.reason || 'Bloqueado'}
                      </div>
                    )
                  })}
                  {layoutLanes(col.items).map(({ apt, lane, lanes }) => {
                    const s = parseISO(apt.startAt)
                    const e = parseISO(apt.endAt)
                    const top = ((s.getHours() * 60 + s.getMinutes() - START_HOUR * 60) / 60) * HOUR_PX
                    const h = Math.max(24, ((e.getTime() - s.getTime()) / 3600000) * HOUR_PX)
                    return (
                      <button
                        key={apt.id}
                        type="button"
                        {...dragProps(apt)}
                        onClick={() => onSelectAppointment?.(apt.id)}
                        title={`${getPatientName(apt.patientId)} · ${appointmentLabels[apt.status]}`}
                        style={{ top, height: h - 2, left: `${(lane / lanes) * 100}%`, width: `${100 / lanes}%` }}
                        className={cn(
                          'absolute cursor-grab overflow-hidden rounded border px-1 py-0.5 text-left text-[10px] leading-tight shadow-sm active:cursor-grabbing',
                          STATUS_STYLE[apt.status],
                          dragId === apt.id && 'opacity-40',
                        )}
                      >
                        <span className="block truncate font-semibold">{getPatientName(apt.patientId)}</span>
                        <span className="block truncate">
                          {format(s, 'HH:mm')}–{format(e, 'HH:mm')}
                          {view !== 'doctor' ? ` · ${dentistName(apt.dentistId)}` : ''}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t px-4 py-3 text-[11px]">
        {(Object.keys(STATUS_STYLE) as AppointmentStatus[]).map((s) => (
          <span key={s} className={cn('rounded border px-2 py-0.5', STATUS_STYLE[s])}>
            {appointmentLabels[s]}
          </span>
        ))}
        <span className="text-muted-foreground">Arrastre una cita para reprogramarla.</span>
      </div>
    </div>
  )
}

function MonthGrid({
  date,
  appointments,
  getPatientName,
  onSelectAppointment,
  dragProps,
  onDropDay,
}: {
  date: Date
  appointments: Appointment[]
  getPatientName: (id: string) => string
  onSelectAppointment?: (id: string) => void
  dragProps: (a: Appointment) => React.HTMLAttributes<HTMLButtonElement>
  onDropDay: (id: string, day: Date) => void
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
  })
  const byDay = React.useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of appointments) {
      const key = format(parseISO(a.startAt), 'yyyy-MM-dd')
      map.set(key, [...(map.get(key) ?? []), a])
    }
    return map
  }, [appointments])

  return (
    <>
      <div className="grid grid-cols-7 gap-px bg-border text-center text-xs font-medium text-muted-foreground">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
          <div key={d} className="bg-teal-50/60 py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border">
        {days.map((day) => {
          const list = (byDay.get(format(day, 'yyyy-MM-dd')) ?? []).sort((a, b) => a.startAt.localeCompare(b.startAt))
          return (
            <div
              key={day.toISOString()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData('text/plain')
                if (id) onDropDay(id, day)
              }}
              className={cn(
                'min-h-[100px] bg-card p-1 sm:min-h-[120px]',
                !isSameMonth(day, date) && 'bg-muted/20 text-muted-foreground',
                isSameDay(day, new Date()) && 'ring-1 ring-inset ring-primary',
              )}
            >
              <div className="mb-1 text-xs font-medium">{format(day, 'd')}</div>
              <div className="space-y-1">
                {list.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    {...dragProps(a)}
                    onClick={() => onSelectAppointment?.(a.id)}
                    className={cn('block w-full cursor-grab rounded border px-1 py-0.5 text-left text-[10px] leading-tight', STATUS_STYLE[a.status])}
                  >
                    <span className="block truncate font-medium">{getPatientName(a.patientId)}</span>
                    <span>{format(parseISO(a.startAt), 'HH:mm')}</span>
                  </button>
                ))}
                {list.length > 3 ? <p className="text-[10px] text-muted-foreground">+{list.length - 3} más</p> : null}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
