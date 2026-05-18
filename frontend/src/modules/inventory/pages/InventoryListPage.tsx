import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, Plus } from 'lucide-react'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { SearchInput } from '@/components/shared/SearchInput'
import { DataTable } from '@/components/tables/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { listItems } from '@/modules/inventory/services/inventoryService'
import { ROUTES } from '@/lib/constants/routes'
import { formatCurrency } from '@/lib/formatters/currency'
import type { InventoryItem } from '@/types/domain'

export function InventoryListPage() {
  const q = useQuery({ queryKey: ['inventory'], queryFn: listItems })
  const [search, setSearch] = React.useState('')
  const [lowOnly, setLowOnly] = React.useState(false)

  const filtered = React.useMemo(() => {
    if (!q.data) return []
    const s = search.trim().toLowerCase()
    return q.data.filter((i) => {
      const match = !s || i.name.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s)
      const low = !lowOnly || i.stock <= i.minStock
      return match && low
    })
  }, [q.data, search, lowOnly])

  const columns = React.useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      { accessorKey: 'sku', header: 'SKU' },
      { accessorKey: 'name', header: 'Insumo' },
      { accessorKey: 'category', header: 'Categoría' },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: ({ row }) => {
          const i = row.original
          const alert = i.stock <= i.minStock
          return (
            <div className="flex items-center gap-2">
              <span>
                {i.stock} {i.unit}
              </span>
              {alert ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Bajo mínimo
                </Badge>
              ) : null}
            </div>
          )
        },
      },
      {
        accessorKey: 'minStock',
        header: 'Mínimo',
        cell: ({ row }) => `${row.original.minStock} ${row.original.unit}`,
      },
      {
        accessorKey: 'unitCost',
        header: 'Costo u.',
        cell: ({ row }) => formatCurrency(row.original.unitCost),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.inventoryItem(row.original.id)}>Ver</Link>
          </Button>
        ),
      },
    ],
    [],
  )

  if (q.isLoading) return <LoadingState />

  return (
    <PageContainer>
      <PageTitle
        title="Inventario"
        description="Stock, mínimos y alertas visuales"
        actions={
          <Button asChild>
            <Link to={ROUTES.inventoryNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo insumo
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput placeholder="Buscar por nombre o SKU…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-md" />
        <Button type="button" variant={lowOnly ? 'default' : 'outline'} size="sm" onClick={() => setLowOnly((v) => !v)}>
          Solo stock bajo
        </Button>
      </div>
      <DataTable columns={columns} data={filtered} />
    </PageContainer>
  )
}
