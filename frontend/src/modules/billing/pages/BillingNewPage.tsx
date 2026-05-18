import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { invoiceCreateSchema, type InvoiceCreateFormValues } from '@/modules/billing/schemas/invoiceSchema'
import { createInvoice } from '@/modules/billing/services/billingService'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { ROUTES } from '@/lib/constants/routes'
import { createId } from '@/lib/utils/id'

export function BillingNewPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const patients = useAppDataStore((s) => s.patients)

  const form = useForm<InvoiceCreateFormValues>({
    resolver: zodResolver(invoiceCreateSchema),
    defaultValues: {
      patientId: patients[0]?.id ?? '',
      dueAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      notes: '',
      lines: [{ description: 'Servicio odontológico', quantity: 1, unitPrice: 15000, treatmentId: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' })

  const mut = useMutation({
    mutationFn: createInvoice,
    onSuccess: (inv) => {
      toast.success('Factura creada')
      qc.invalidateQueries({ queryKey: ['invoices'] })
      navigate(ROUTES.invoice(inv.id))
    },
  })

  function onSubmit(values: InvoiceCreateFormValues) {
    const lines = values.lines.map((l) => ({
      id: createId('l'),
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      treatmentId: l.treatmentId || undefined,
    }))
    mut.mutate({
      patientId: values.patientId,
      dueAt: new Date(values.dueAt).toISOString(),
      notes: values.notes,
      lines,
    })
  }

  return (
    <PageContainer>
      <PageTitle title="Nueva factura" description="Ítems con IVA 21% simulado en el servicio" />
      <form className="mx-auto max-w-2xl space-y-6 rounded-lg border bg-card p-6 shadow-sm" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField label="Paciente" required error={form.formState.errors.patientId?.message}>
          <Select value={form.watch('patientId')} onValueChange={(v) => form.setValue('patientId', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Vencimiento" required error={form.formState.errors.dueAt?.message}>
          <Input type="date" {...form.register('dueAt')} />
        </FormField>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Líneas</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0, treatmentId: '' })}
            >
              Agregar ítem
            </Button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <FormField label="Descripción" error={form.formState.errors.lines?.[index]?.description?.message}>
                  <Input {...form.register(`lines.${index}.description` as const)} />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField label="Cant." error={form.formState.errors.lines?.[index]?.quantity?.message}>
                  <Input type="number" min={1} {...form.register(`lines.${index}.quantity` as const, { valueAsNumber: true })} />
                </FormField>
              </div>
              <div className="sm:col-span-3">
                <FormField label="Precio u." error={form.formState.errors.lines?.[index]?.unitPrice?.message}>
                  <Input type="number" min={0} {...form.register(`lines.${index}.unitPrice` as const, { valueAsNumber: true })} />
                </FormField>
              </div>
              <div className="flex items-end sm:col-span-2">
                <Button type="button" variant="ghost" className="w-full" onClick={() => remove(index)}>
                  Quitar
                </Button>
              </div>
            </div>
          ))}
        </div>
        <FormField label="Notas" error={form.formState.errors.notes?.message}>
          <Textarea rows={2} {...form.register('notes')} />
        </FormField>
        <div className="flex gap-2">
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending ? 'Emitiendo…' : 'Emitir factura'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(ROUTES.billing)}>
            Cancelar
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
