import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { CalendarDays, Plus } from 'lucide-react'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { SearchInput } from '@/components/shared/SearchInput'
import { AppointmentStatusBadge } from '@/components/shared/StatusBadge'
import { DataTable } from '@/components/tables/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { listAppointments } from '@/modules/appointments/services/appointmentsService'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { ROUTES } from '@/lib/constants/routes'
import { formatDateTime } from '@/lib/formatters/date'
import type { Appointment } from '@/types/domain'
import type { AppointmentStatus } from '@/types/common'

export function AppointmentsListPage() {
  const q = useQuery({ queryKey: ['appointments'], queryFn: listAppointments })
  const patients = useAppDataStore((s) => s.patients)
  const dentists = useAppDataStore((s) => s.dentists)

  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<AppointmentStatus | 'all'>('all')
  const [dentistId, setDentistId] = React.useState<string>('all')

  const nameOf = (pid: string) => {
    const p = patients.find((x) => x.id === pid)
    return p ? `${p.firstName} ${p.lastName}` : pid
  }

  const filtered = React.useMemo(() => {
    if (!q.data) return []
    const s = search.trim().toLowerCase()
    return q.data.filter((a) => {
      const patientName = nameOf(a.patientId).toLowerCase()
      const match = !s || patientName.includes(s) || a.reason.toLowerCase().includes(s)
      const st = status === 'all' || a.status === status
      const d = dentistId === 'all' || a.dentistId === dentistId
      return match && st && d
    })
  }, [q.data, search, status, dentistId, patients])

  const columns = React.useMemo<ColumnDef<Appointment>[]>(
    () => [
      {
        accessorKey: 'startAt',
        header: 'Fecha / hora',
        cell: ({ row }) => formatDateTime(row.original.startAt),
      },
      {
        id: 'patient',
        header: 'Paciente',
        cell: ({ row }) => nameOf(row.original.patientId),
      },
      {
        id: 'dentist',
        header: 'Odontólogo',
        cell: ({ row }) => dentists.find((d) => d.id === row.original.dentistId)?.name ?? '—',
      },
      { accessorKey: 'reason', header: 'Motivo' },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => <AppointmentStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.appointment(row.original.id)}>Ver</Link>
          </Button>
        ),
      },
    ],
    [dentists, patients],
  )

  if (q.isLoading) return <LoadingState />
  if (q.isError) return <ErrorState message="No se pudieron cargar las citas." onRetry={() => q.refetch()} />

  return (
    <PageContainer>
      <PageTitle
        title="Citas"
        description="Listado con filtros — agenda sincronizada con datos mock"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to={ROUTES.appointmentsCalendar}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Calendario
              </Link>
            </Button>
            <Button asChild>
              <Link to={ROUTES.appointmentNew}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva cita
              </Link>
            </Button>
          </>
        }
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <SearchInput
          placeholder="Buscar por paciente o motivo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="lg:max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="in_progress">En atención</SelectItem>
              <SelectItem value="completed">Finalizada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dentistId} onValueChange={setDentistId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Odontólogo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {dentists.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable columns={columns} data={filtered} />
    </PageContainer>
  )
}
