import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { inventoryItemSchema, type InventoryItemFormValues } from '@/modules/inventory/schemas/inventorySchema'
import { createItem } from '@/modules/inventory/services/inventoryService'
import { ROUTES } from '@/lib/constants/routes'

export function InventoryNewPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      sku: '',
      name: '',
      category: 'General',
      unit: 'unidad',
      stock: 0,
      minStock: 5,
      unitCost: 0,
      supplier: '',
    },
  })

  const mut = useMutation({
    mutationFn: createItem,
    onSuccess: (item) => {
      toast.success('Insumo creado')
      qc.invalidateQueries({ queryKey: ['inventory'] })
      navigate(ROUTES.inventoryItem(item.id))
    },
  })

  return (
    <PageContainer>
      <PageTitle title="Nuevo insumo" />
      <form className="mx-auto max-w-xl space-y-4 rounded-lg border bg-card p-6 shadow-sm" onSubmit={form.handleSubmit((v) => mut.mutate(v))} noValidate>
        <FormField label="SKU" required error={form.formState.errors.sku?.message}>
          <Input {...form.register('sku')} />
        </FormField>
        <FormField label="Nombre" required error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Categoría" required error={form.formState.errors.category?.message}>
            <Input {...form.register('category')} />
          </FormField>
          <FormField label="Unidad" required error={form.formState.errors.unit?.message}>
            <Input {...form.register('unit')} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Stock inicial" required error={form.formState.errors.stock?.message}>
            <Input type="number" min={0} {...form.register('stock', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Stock mínimo" required error={form.formState.errors.minStock?.message}>
            <Input type="number" min={0} {...form.register('minStock', { valueAsNumber: true })} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Costo unitario" required error={form.formState.errors.unitCost?.message}>
            <Input type="number" min={0} {...form.register('unitCost', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Proveedor" required error={form.formState.errors.supplier?.message}>
            <Input {...form.register('supplier')} />
          </FormField>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(ROUTES.inventory)}>
            Cancelar
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
