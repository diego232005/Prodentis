import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { TreatmentStatusBadge } from '@/components/shared/StatusBadge'
import { DataTable } from '@/components/tables/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { SectionCard } from '@/components/shared/SectionCard'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { treatmentSchema, type TreatmentFormValues } from '@/modules/treatments/schemas/treatmentSchema'
import { createTreatment, listProcedures, listTreatments } from '@/modules/treatments/services/treatmentsService'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { ROUTES } from '@/lib/constants/routes'
import { formatCurrency } from '@/lib/formatters/currency'
import type { Treatment } from '@/types/domain'

export function TreatmentsListPage() {
  const qc = useQueryClient()
  const patients = useAppDataStore((s) => s.patients)
  const dentists = useAppDataStore((s) => s.dentists)

  const q = useQuery({ queryKey: ['treatments'], queryFn: listTreatments })
  const procQ = useQuery({ queryKey: ['procedures'], queryFn: listProcedures })

  const form = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      patientId: patients[0]?.id ?? '',
      dentistId: dentists[0]?.id ?? '',
      procedureId: procQ.data?.[0]?.id ?? '',
      status: 'planned',
      startDate: new Date().toISOString().slice(0, 10),
      sessionsPlanned: 1,
      sessionsDone: 0,
      cost: 0,
      notes: '',
    },
  })

  React.useEffect(() => {
    if (procQ.data?.[0]) form.setValue('procedureId', procQ.data[0].id)
  }, [procQ.data, form])

  const createMut = useMutation({
    mutationFn: createTreatment,
    onSuccess: () => {
      toast.success('Tratamiento asignado')
      qc.invalidateQueries({ queryKey: ['treatments'] })
    },
  })

  function onAssign(values: TreatmentFormValues) {
    const proc = procQ.data?.find((p) => p.id === values.procedureId)
    const cost = values.cost || proc?.basePrice || 0
    createMut.mutate({
      patientId: values.patientId,
      dentistId: values.dentistId,
      procedureId: values.procedureId,
      status: values.status,
      startDate: new Date(values.startDate).toISOString(),
      sessionsPlanned: values.sessionsPlanned,
      sessionsDone: values.sessionsDone,
      cost,
      notes: values.notes,
    })
  }

  const columns = React.useMemo<ColumnDef<Treatment>[]>(
    () => [
      {
        id: 'patient',
        header: 'Paciente',
        cell: ({ row }) => {
          const p = patients.find((x) => x.id === row.original.patientId)
          return p ? `${p.firstName} ${p.lastName}` : row.original.patientId
        },
      },
      {
        id: 'procedure',
        header: 'Procedimiento',
        cell: ({ row }) => procQ.data?.find((p) => p.id === row.original.procedureId)?.name ?? '—',
      },
      {
        accessorKey: 'cost',
        header: 'Costo',
        cell: ({ row }) => formatCurrency(row.original.cost),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => <TreatmentStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.treatment(row.original.id)}>Ver</Link>
          </Button>
        ),
      },
    ],
    [patients, procQ.data],
  )

  if (q.isLoading || procQ.isLoading) return <LoadingState />

  return (
    <PageContainer>
      <PageTitle title="Tratamientos" description="Catálogo asignado a pacientes y seguimiento de sesiones" />
      <SectionCard title="Asignar tratamiento a paciente" description="Formulario validado — costo por defecto del catálogo si deja 0">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onAssign)} noValidate>
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
          <FormField label="Odontólogo" required error={form.formState.errors.dentistId?.message}>
            <Select value={form.watch('dentistId')} onValueChange={(v) => form.setValue('dentistId', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dentists.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Procedimiento" required error={form.formState.errors.procedureId?.message}>
            <Select value={form.watch('procedureId')} onValueChange={(v) => form.setValue('procedureId', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(procQ.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.basePrice)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Estado inicial" required error={form.formState.errors.status?.message}>
            <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v as TreatmentFormValues['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planificado</SelectItem>
                <SelectItem value="in_progress">En curso</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Fecha de inicio" required error={form.formState.errors.startDate?.message}>
            <Input type="date" {...form.register('startDate')} />
          </FormField>
          <FormField label="Sesiones planificadas" required error={form.formState.errors.sessionsPlanned?.message}>
            <Input type="number" min={1} {...form.register('sessionsPlanned', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Costo (ARS)" error={form.formState.errors.cost?.message}>
            <Input type="number" min={0} {...form.register('cost', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Notas" className="md:col-span-2" error={form.formState.errors.notes?.message}>
            <Textarea rows={2} {...form.register('notes')} />
          </FormField>
          <div className="md:col-span-2">
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? 'Guardando…' : 'Asignar tratamiento'}
            </Button>
          </div>
        </form>
      </SectionCard>
      <SectionCard title="Catálogo de procedimientos" description="Referencia de precios base">
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {(procQ.data ?? []).map((p) => (
            <li key={p.id} className="rounded-md border px-3 py-2">
              <span className="font-medium">{p.name}</span>
              <span className="ml-2 text-muted-foreground">{formatCurrency(p.basePrice)}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
      <DataTable columns={columns} data={q.data ?? []} />
    </PageContainer>
  )
}
