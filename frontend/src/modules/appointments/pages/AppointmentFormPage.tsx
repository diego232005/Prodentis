import * as React from 'react'
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
import { APPOINTMENT_STATUSES, appointmentSchema, type AppointmentFormValues } from '@/modules/appointments/schemas/appointmentSchema'
import { createAppointment } from '@/modules/appointments/services/appointmentsService'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { appointmentLabels } from '@/lib/constants/appointmentStatus'
import { ROUTES } from '@/lib/constants/routes'
import { datetimeLocalToIso, isoToDatetimeLocalValue } from '@/lib/utils/datetimeLocal'

export function AppointmentFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const patients = useAppDataStore((s) => s.patients)
  const dentists = useAppDataStore((s) => s.dentists)
  const chairs = useAppDataStore((s) => s.chairs).filter((c) => c.active)
  const procedures = useAppDataStore((s) => s.procedures)
  const appointments = useAppDataStore((s) => s.appointments)

  const defaultStart = new Date()
  defaultStart.setMinutes(0, 0, 0)
  defaultStart.setHours(defaultStart.getHours() + 1)
  const defaultEnd = new Date(defaultStart.getTime() + 30 * 60 * 1000)

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: patients[0]?.id ?? '',
      dentistId: dentists[0]?.id ?? '',
      chairId: '',
      procedureId: '',
      startAt: isoToDatetimeLocalValue(defaultStart.toISOString()),
      endAt: isoToDatetimeLocalValue(defaultEnd.toISOString()),
      status: 'pending',
      reason: '',
      notes: '',
    },
  })

  const [startAt, endAt, dentistId, chairId] = form.watch(['startAt', 'endAt', 'dentistId', 'chairId'])
  const conflict = React.useMemo(() => {
    if (!startAt || !endAt) return null
    const s = new Date(startAt).getTime()
    const e = new Date(endAt).getTime()
    return appointments.find(
      (a) =>
        a.status !== 'cancelled' &&
        a.status !== 'no_show' &&
        (a.dentistId === dentistId || (chairId && a.chairId === chairId)) &&
        new Date(a.startAt).getTime() < e &&
        new Date(a.endAt).getTime() > s,
    )
  }, [appointments, startAt, endAt, dentistId, chairId])

  function onProcedureChange(id: string) {
    form.setValue('procedureId', id)
    const proc = procedures.find((p) => p.id === id)
    const start = form.getValues('startAt')
    if (proc && start) {
      const end = new Date(new Date(start).getTime() + proc.durationMinutes * 60000)
      form.setValue('endAt', isoToDatetimeLocalValue(end.toISOString()))
      if (!form.getValues('reason')) form.setValue('reason', proc.name)
    }
  }

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
      chairId: values.chairId || undefined,
      procedureId: values.procedureId || undefined,
      status: values.status,
      reason: values.reason,
      notes: values.notes,
    })
  }

  return (
    <PageContainer>
      <PageTitle title="Nueva cita" description="Seleccione sillón y procedimiento para calcular la duración" />
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
          <FormField label="Sillón" htmlFor="chairId">
            <Select value={form.watch('chairId') || 'none'} onValueChange={(v) => form.setValue('chairId', v === 'none' ? '' : v)}>
              <SelectTrigger id="chairId">
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {chairs.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Procedimiento" htmlFor="procedureId">
            <Select value={form.watch('procedureId') || 'none'} onValueChange={(v) => onProcedureChange(v === 'none' ? '' : v)}>
              <SelectTrigger id="procedureId">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin procedimiento</SelectItem>
                {procedures.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.durationMinutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
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
              {APPOINTMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {appointmentLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        {conflict ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Atención: el odontólogo o sillón ya tiene una cita en ese horario.
          </p>
        ) : null}
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
