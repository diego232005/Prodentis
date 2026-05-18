import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { SearchInput } from '@/components/shared/SearchInput'
import { PatientStatusBadge } from '@/components/shared/StatusBadge'
import { DataTable } from '@/components/tables/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/button'
import { listPatients } from '@/modules/patients/services/patientsService'
import { ROUTES } from '@/lib/constants/routes'
import type { Patient } from '@/types/domain'

export function PatientsListPage() {
  const navigate = useNavigate()
  const q = useQuery({ queryKey: ['patients'], queryFn: listPatients })
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<'all' | Patient['status']>('all')

  const filtered = React.useMemo(() => {
    if (!q.data) return []
    const s = search.trim().toLowerCase()
    return q.data.filter((p) => {
      const match =
        !s ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(s) ||
        p.documentId.includes(s) ||
        p.email.toLowerCase().includes(s)
      const st = status === 'all' || p.status === status
      return match && st
    })
  }, [q.data, search, status])

  const handleViewPatient = React.useCallback(
    (id: string) => {
      navigate(ROUTES.patient(id))
    },
    [navigate],
  )

  const columns = React.useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        accessorKey: 'lastName',
        header: 'Paciente',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              {row.original.firstName} {row.original.lastName}
            </p>
            <p className="text-xs text-muted-foreground">DNI {row.original.documentId}</p>
          </div>
        ),
      },
      { accessorKey: 'phone', header: 'Teléfono' },
      { accessorKey: 'email', header: 'Correo' },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => <PatientStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => handleViewPatient(row.original.id)}>
            Ver
          </Button>
        ),
      },
    ],
    [handleViewPatient],
  )

  if (q.isLoading) return <LoadingState />
  if (q.isError) return <ErrorState message="No se pudieron cargar los pacientes." onRetry={() => q.refetch()} />

  return (
    <PageContainer>
      <PageTitle
        title="Pacientes"
        description="Registro clínico-administrativo"
        actions={
          <Button asChild>
            <Link to={ROUTES.patientNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo paciente
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Buscar por nombre, documento o correo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-md"
        />
        <div className="flex gap-2">
          {(['all', 'active', 'inactive', 'archived'] as const).map((st) => (
            <Button
              key={st}
              type="button"
              variant={status === st ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(st)}
            >
              {st === 'all' ? 'Todos' : st === 'active' ? 'Activos' : st === 'inactive' ? 'Inactivos' : 'Archivados'}
            </Button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          title="Sin pacientes para mostrar"
          description="Ajuste los filtros o registre un nuevo paciente."
          actionLabel="Nuevo paciente"
          onAction={() => navigate(ROUTES.patientNew)}
        />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}
    </PageContainer>
  )
}
