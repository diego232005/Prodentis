import * as React from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { AppointmentStatusBadge } from '@/components/shared/StatusBadge'
import type { Appointment } from '@/types/domain'
import type { AppointmentStatus } from '@/types/common'

interface CalendarViewProps {
  appointments: Appointment[]
  getPatientName: (patientId: string) => string
  month: Date
  onMonthChange: (d: Date) => void
  onSelectAppointment?: (id: string) => void
}

export function CalendarView({
  appointments,
  getPatientName,
  month,
  onMonthChange,
  onSelectAppointment,
}: CalendarViewProps) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })

  const byDay = React.useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of appointments) {
      const key = format(parseISO(a.startAt), 'yyyy-MM-dd')
      const list = map.get(key) ?? []
      list.push(a)
      map.set(key, list)
    }
    return map
  }, [appointments])

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <button
          type="button"
          className="rounded-md px-2 py-1 text-sm hover:bg-muted"
          onClick={() => onMonthChange(addMonths(month, -1))}
        >
          ←
        </button>
        <p className="text-sm font-semibold capitalize">{format(month, 'MMMM yyyy', { locale: es })}</p>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-sm hover:bg-muted"
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-border text-center text-xs font-medium text-muted-foreground">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
          <div key={d} className="bg-muted/40 py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayApts = byDay.get(key) ?? []
          const muted = !isSameMonth(day, month)
          return (
            <div
              key={key}
              className={cn('min-h-[100px] bg-card p-1 text-left sm:min-h-[120px]', muted && 'bg-muted/20 text-muted-foreground')}
            >
              <div className="mb-1 text-xs font-medium">{format(day, 'd')}</div>
              <div className="space-y-1">
                {dayApts.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onSelectAppointment?.(a.id)}
                    className="block w-full rounded border border-transparent bg-primary/5 px-1 py-0.5 text-left text-[10px] leading-tight hover:border-primary/30"
                  >
                    <span className="line-clamp-2 font-medium">{getPatientName(a.patientId)}</span>
                    <span className="text-muted-foreground">{format(parseISO(a.startAt), 'HH:mm')}</span>
                  </button>
                ))}
                {dayApts.length > 3 ? (
                  <p className="text-[10px] text-muted-foreground">+{dayApts.length - 3} más</p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 border-t px-4 py-3 text-xs">
        {(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as AppointmentStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1">
            <AppointmentStatusBadge status={s} />
          </div>
        ))}
      </div>
    </div>
  )
}
