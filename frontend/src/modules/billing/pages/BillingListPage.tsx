import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { SearchInput } from '@/components/shared/SearchInput'
import { InvoiceStatusBadge } from '@/components/shared/StatusBadge'
import { DataTable } from '@/components/tables/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { listInvoices } from '@/modules/billing/services/billingService'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { ROUTES } from '@/lib/constants/routes'
import { formatCurrency } from '@/lib/formatters/currency'
import { formatDate } from '@/lib/formatters/date'
import type { Invoice } from '@/types/domain'
import type { InvoiceStatus } from '@/types/common'

export function BillingListPage() {
  const q = useQuery({ queryKey: ['invoices'], queryFn: listInvoices })
  const patients = useAppDataStore((s) => s.patients)
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<InvoiceStatus | 'all'>('all')

  const patientName = (id: string) => {
    const p = patients.find((x) => x.id === id)
    return p ? `${p.firstName} ${p.lastName}` : id
  }

  const filtered = React.useMemo(() => {
    if (!q.data) return []
    const s = search.trim().toLowerCase()
    return q.data.filter((inv) => {
      const match = !s || inv.id.toLowerCase().includes(s) || patientName(inv.patientId).toLowerCase().includes(s)
      const st = status === 'all' || inv.status === status
      return match && st
    })
  }, [q.data, search, status, patients])

  const columns = React.useMemo<ColumnDef<Invoice>[]>(
    () => [
      { accessorKey: 'id', header: 'Número' },
      {
        id: 'patient',
        header: 'Paciente',
        cell: ({ row }) => patientName(row.original.patientId),
      },
      {
        accessorKey: 'issuedAt',
        header: 'Emisión',
        cell: ({ row }) => formatDate(row.original.issuedAt),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => formatCurrency(row.original.total),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.invoice(row.original.id)}>Ver</Link>
          </Button>
        ),
      },
    ],
    [patients],
  )

  if (q.isLoading) return <LoadingState />

  return (
    <PageContainer>
      <PageTitle
        title="Facturación"
        description="Facturas mock con impuestos y pagos simulados"
        actions={
          <Button asChild>
            <Link to={ROUTES.billingNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva factura
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput placeholder="Buscar por paciente o ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-md" />
        <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus | 'all')}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="partial">Parcial</SelectItem>
            <SelectItem value="paid">Pagada</SelectItem>
            <SelectItem value="void">Anulada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filtered} />
    </PageContainer>
  )
}
