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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { appointmentSchema, type AppointmentFormValues } from '@/modules/appointments/schemas/appointmentSchema'
import { createAppointment } from '@/modules/appointments/services/appointmentsService'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { ROUTES } from '@/lib/constants/routes'
import { datetimeLocalToIso, isoToDatetimeLocalValue } from '@/lib/utils/datetimeLocal'

export function AppointmentFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const patients = useAppDataStore((s) => s.patients)
  const dentists = useAppDataStore((s) => s.dentists)

  const defaultStart = new Date()
  defaultStart.setMinutes(0, 0, 0)
  defaultStart.setHours(defaultStart.getHours() + 1)
  const defaultEnd = new Date(defaultStart.getTime() + 30 * 60 * 1000)

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: patients[0]?.id ?? '',
      dentistId: dentists[0]?.id ?? '',
      startAt: isoToDatetimeLocalValue(defaultStart.toISOString()),
      endAt: isoToDatetimeLocalValue(defaultEnd.toISOString()),
      status: 'pending',
      reason: '',
      notes: '',
    },
  })

  const mut = useMutation({
    mutationFn: createAppointment,
    onSuccess: (a) => {
      toast.success('Cita creada')
      qc.invalidateQueries({ queryKey: ['appointments'] })
      navigate(ROUTES.appointment(a.id))
    },
  })

  function onSubmit(values: AppointmentFormValues) {
    mut.mutate({
      patientId: values.patientId,
      dentistId: values.dentistId,
      startAt: datetimeLocalToIso(values.startAt),
      endAt: datetimeLocalToIso(values.endAt),
      status: values.status,
      reason: values.reason,
      notes: values.notes,
    })
  }

  return (
    <PageContainer>
      <PageTitle title="Nueva cita" description="La agenda mock se actualizará al guardar" />
      <form className="mx-auto max-w-xl space-y-4 rounded-lg border bg-card p-6 shadow-sm" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField label="Paciente" htmlFor="patientId" error={form.formState.errors.patientId?.message} required>
          <Select value={form.watch('patientId')} onValueChange={(v) => form.setValue('patientId', v)}>
            <SelectTrigger id="patientId">
              <SelectValue placeholder="Seleccione" />
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
        <FormField label="Odontólogo" htmlFor="dentistId" error={form.formState.errors.dentistId?.message} required>
          <Select value={form.watch('dentistId')} onValueChange={(v) => form.setValue('dentistId', v)}>
            <SelectTrigger id="dentistId">
              <SelectValue placeholder="Seleccione" />
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
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Inicio" htmlFor="startAt" error={form.formState.errors.startAt?.message} required>
            <Input id="startAt" type="datetime-local" {...form.register('startAt')} />
          </FormField>
          <FormField label="Fin" htmlFor="endAt" error={form.formState.errors.endAt?.message} required>
            <Input id="endAt" type="datetime-local" {...form.register('endAt')} />
          </FormField>
        </div>
        <FormField label="Estado" htmlFor="status" error={form.formState.errors.status?.message} required>
          <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v as AppointmentFormValues['status'])}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="in_progress">En atención</SelectItem>
              <SelectItem value="completed">Finalizada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Motivo" htmlFor="reason" error={form.formState.errors.reason?.message} required>
          <Input id="reason" {...form.register('reason')} />
        </FormField>
        <FormField label="Notas" htmlFor="notes" error={form.formState.errors.notes?.message}>
          <Textarea id="notes" rows={3} {...form.register('notes')} />
        </FormField>
        <div className="flex gap-2">
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending ? 'Guardando…' : 'Guardar cita'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
