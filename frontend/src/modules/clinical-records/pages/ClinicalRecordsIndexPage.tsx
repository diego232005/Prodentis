import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { SearchInput } from '@/components/shared/SearchInput'
import { DataTable } from '@/components/tables/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Button } from '@/components/ui/button'
import { listPatients } from '@/modules/patients/services/patientsService'
import { ROUTES } from '@/lib/constants/routes'
import type { Patient } from '@/types/domain'

export function ClinicalRecordsIndexPage() {
  const q = useQuery({ queryKey: ['patients'], queryFn: listPatients })
  const [search, setSearch] = React.useState('')

  const filtered = React.useMemo(() => {
    if (!q.data) return []
    const s = search.trim().toLowerCase()
    return q.data.filter(
      (p) =>
        !s ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(s) ||
        p.documentId.includes(s),
    )
  }, [q.data, search])

  const columns = React.useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        accessorKey: 'lastName',
        header: 'Paciente',
        cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
      },
      { accessorKey: 'documentId', header: 'Documento' },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button size="sm" asChild>
            <Link to={ROUTES.clinicalRecordPatient(row.original.id)}>Abrir historia</Link>
          </Button>
        ),
      },
    ],
    [],
  )

  if (q.isLoading) return <LoadingState />

  return (
    <PageContainer>
      <PageTitle title="Historia clínica" description="Seleccione un paciente para ver la línea de tiempo clínica" />
      <SearchInput placeholder="Buscar paciente…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      <DataTable columns={columns} data={filtered} />
    </PageContainer>
  )
}
