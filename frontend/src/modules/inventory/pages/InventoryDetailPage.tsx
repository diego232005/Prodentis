import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { InfoGrid } from '@/components/shared/InfoGrid'
import { SectionCard } from '@/components/shared/SectionCard'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { stockMovementSchema, type StockMovementFormValues } from '@/modules/inventory/schemas/inventorySchema'
import { getItem, listMovements, recordMovement, updateItem } from '@/modules/inventory/services/inventoryService'
import { ROUTES } from '@/lib/constants/routes'
import { formatCurrency } from '@/lib/formatters/currency'
import { formatDateTime } from '@/lib/formatters/date'

export function InventoryDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()

  const itemQ = useQuery({
    queryKey: ['inventory-item', id],
    queryFn: () => getItem(id!),
    enabled: Boolean(id),
  })

  const movQ = useQuery({
    queryKey: ['inventory-movements', id],
    queryFn: () => listMovements(id),
    enabled: Boolean(id),
  })

  const moveForm = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: { itemId: id ?? '', type: 'in', quantity: 1, reason: '' },
  })

  React.useEffect(() => {
    if (id) moveForm.setValue('itemId', id)
  }, [id, moveForm])

  const moveMut = useMutation({
    mutationFn: recordMovement,
    onSuccess: () => {
      toast.success('Movimiento registrado')
      qc.invalidateQueries({ queryKey: ['inventory-item', id] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['inventory-movements', id] })
      moveForm.reset({ itemId: id ?? '', type: 'in', quantity: 1, reason: '' })
    },
  })

  const saveMut = useMutation({
    mutationFn: updateItem,
    onSuccess: () => {
      toast.success('Insumo actualizado')
      qc.invalidateQueries({ queryKey: ['inventory-item', id] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })

  const [editStock, setEditStock] = React.useState<string>('')

  if (itemQ.isLoading) return <LoadingState />
  if (itemQ.isError || !itemQ.data) return <ErrorState message="Insumo no encontrado." />

  const item = itemQ.data

  return (
    <PageContainer>
      <PageTitle
        title={item.name}
        description={`SKU ${item.sku}`}
        actions={
          <Button variant="outline" asChild>
            <Link to={ROUTES.inventory}>Volver</Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Datos del insumo">
          <InfoGrid
            items={[
              { label: 'Categoría', value: item.category },
              { label: 'Proveedor', value: item.supplier },
              { label: 'Stock', value: `${item.stock} ${item.unit}` },
              { label: 'Mínimo', value: `${item.minStock} ${item.unit}` },
              { label: 'Costo unitario', value: formatCurrency(item.unitCost) },
            ]}
          />
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <FormField label="Ajustar stock manualmente" className="max-w-[140px]">
              <Input type="number" min={0} value={editStock} onChange={(e) => setEditStock(e.target.value)} placeholder={String(item.stock)} />
            </FormField>
            <Button
              type="button"
              onClick={() => {
                const n = Number(editStock)
                if (Number.isFinite(n) && n >= 0) {
                  saveMut.mutate({ ...item, stock: n, updatedAt: new Date().toISOString() })
                  setEditStock('')
                }
              }}
            >
              Guardar stock
            </Button>
          </div>
        </SectionCard>
        <SectionCard title="Entrada / salida simulada">
          <form className="space-y-3" onSubmit={moveForm.handleSubmit((v) => moveMut.mutate(v))} noValidate>
            <FormField label="Tipo" required error={moveForm.formState.errors.type?.message}>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                {...moveForm.register('type')}
              >
                <option value="in">Entrada</option>
                <option value="out">Salida</option>
              </select>
            </FormField>
            <FormField label="Cantidad" required error={moveForm.formState.errors.quantity?.message}>
              <Input type="number" min={1} {...moveForm.register('quantity', { valueAsNumber: true })} />
            </FormField>
            <FormField label="Motivo" required error={moveForm.formState.errors.reason?.message}>
              <Input {...moveForm.register('reason')} />
            </FormField>
            <Button type="submit" disabled={moveMut.isPending}>
              {moveMut.isPending ? 'Registrando…' : 'Registrar movimiento'}
            </Button>
          </form>
        </SectionCard>
      </div>
      <SectionCard title="Historial de movimientos">
        <ul className="space-y-2 text-sm">
          {(movQ.data ?? []).map((m) => (
            <li key={m.id} className="flex flex-wrap justify-between gap-2 rounded-md border px-3 py-2">
              <span>
                {m.type === 'in' ? 'Entrada' : 'Salida'} · {m.quantity}
              </span>
              <span className="text-muted-foreground">{m.reason}</span>
              <time className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</time>
            </li>
          ))}
          {(movQ.data ?? []).length === 0 ? <li className="text-muted-foreground">Sin movimientos</li> : null}
        </ul>
      </SectionCard>
    </PageContainer>
  )
}
