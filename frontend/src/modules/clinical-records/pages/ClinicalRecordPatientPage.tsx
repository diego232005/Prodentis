import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { SectionCard } from '@/components/shared/SectionCard'
import { Timeline } from '@/components/shared/Timeline'
import { FormField } from '@/components/forms/FormField'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OdontogramSimple } from '@/modules/clinical-records/components/OdontogramSimple'
import { clinicalEntrySchema, type ClinicalEntryFormValues } from '@/modules/clinical-records/schemas/clinicalEntrySchema'
import { addEntry, getOdontogram, listAttachments, listEntriesByPatient, saveOdontogram } from '@/modules/clinical-records/services/clinicalRecordsService'
import { getPatient } from '@/modules/patients/services/patientsService'
import { useSessionStore } from '@/app/store/useSessionStore'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { ROUTES } from '@/lib/constants/routes'

export function ClinicalRecordPatientPage() {
  const { patientId } = useParams()
  const qc = useQueryClient()
  const user = useSessionStore((s) => s.user)
  const dentists = useAppDataStore((s) => s.dentists)

  const dentistId = dentists.find((d) => d.userId === user?.id)?.id ?? dentists[0]?.id

  const patientQ = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => getPatient(patientId!),
    enabled: Boolean(patientId),
  })
  const entriesQ = useQuery({
    queryKey: ['clinical', patientId],
    queryFn: () => listEntriesByPatient(patientId!),
    enabled: Boolean(patientId),
  })
  const odoQ = useQuery({
    queryKey: ['odontogram', patientId],
    queryFn: () => getOdontogram(patientId!),
    enabled: Boolean(patientId),
  })
  const attQ = useQuery({
    queryKey: ['attachments', patientId],
    queryFn: () => listAttachments(patientId!),
    enabled: Boolean(patientId),
  })

  const form = useForm<ClinicalEntryFormValues>({
    resolver: zodResolver(clinicalEntrySchema),
    defaultValues: { type: 'evolution', title: '', content: '', diagnosisCode: '', procedureId: '' },
  })

  const addMut = useMutation({
    mutationFn: addEntry,
    onSuccess: () => {
      toast.success('Registro clínico agregado')
      qc.invalidateQueries({ queryKey: ['clinical', patientId] })
      form.reset({ type: 'evolution', title: '', content: '', diagnosisCode: '', procedureId: '' })
    },
  })

  const saveOdoMut = useMutation({
    mutationFn: saveOdontogram,
    onSuccess: () => {
      toast.success('Odontograma guardado')
      qc.invalidateQueries({ queryKey: ['odontogram', patientId] })
    },
  })

  function onSubmit(values: ClinicalEntryFormValues) {
    if (!patientId || !dentistId) return
    addMut.mutate({
      patientId,
      dentistId,
      type: values.type,
      title: values.title,
      content: values.content,
      diagnosisCode: values.diagnosisCode || undefined,
      procedureId: values.procedureId || undefined,
    })
  }

  if (patientQ.isLoading) return <LoadingState />
  if (patientQ.isError || !patientQ.data) return <ErrorState message="Paciente no encontrado." />

  const p = patientQ.data
  const timelineItems =
    entriesQ.data?.map((e) => ({
      id: e.id,
      title: e.title,
      subtitle: e.type,
      body: e.content,
      createdAt: e.createdAt,
    })) ?? []

  return (
    <PageContainer>
      <PageTitle
        title={`Historia clínica — ${p.firstName} ${p.lastName}`}
        description="Línea de tiempo, evolución y odontograma (simulado)"
        actions={
          <Button variant="outline" asChild>
            <Link to={ROUTES.patient(p.id)}>Ficha del paciente</Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Registrar evolución / nota clínica">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FormField label="Tipo" htmlFor="type" error={form.formState.errors.type?.message} required>
              <Select value={form.watch('type')} onValueChange={(v) => form.setValue('type', v as ClinicalEntryFormValues['type'])}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evolution">Evolución</SelectItem>
                  <SelectItem value="diagnosis">Diagnóstico</SelectItem>
                  <SelectItem value="procedure">Procedimiento</SelectItem>
                  <SelectItem value="note">Nota</SelectItem>
                  <SelectItem value="attachment">Adjunto (referencia)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Título" htmlFor="title" error={form.formState.errors.title?.message} required>
              <Input id="title" {...form.register('title')} />
            </FormField>
            <FormField label="Contenido" htmlFor="content" error={form.formState.errors.content?.message} required>
              <Textarea id="content" rows={4} {...form.register('content')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Código diagnóstico (opcional)" htmlFor="diagnosisCode" error={form.formState.errors.diagnosisCode?.message}>
                <Input id="diagnosisCode" {...form.register('diagnosisCode')} />
              </FormField>
              <FormField label="ID procedimiento (opcional)" htmlFor="procedureId" error={form.formState.errors.procedureId?.message}>
                <Input id="procedureId" {...form.register('procedureId')} />
              </FormField>
            </div>
            <Button type="submit" disabled={addMut.isPending}>
              {addMut.isPending ? 'Guardando…' : 'Agregar a la historia'}
            </Button>
          </form>
        </SectionCard>
        <SectionCard title="Odontograma">
          {odoQ.data ? (
            <OdontogramSimple
              state={odoQ.data}
              onChange={(next) => saveOdoMut.mutate(next)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Cargando odontograma…</p>
          )}
        </SectionCard>
      </div>
      <SectionCard title="Archivos simulados">
        <ul className="space-y-2 text-sm">
          {(attQ.data ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span>{a.name}</span>
              <Button size="sm" variant="outline" type="button" onClick={() => toast.message('Descarga simulada')}>
                Ver
              </Button>
            </li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Línea de tiempo clínica">
        {entriesQ.isLoading ? (
          <LoadingState message="Cargando historial…" />
        ) : timelineItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay registros para este paciente.</p>
        ) : (
          <Timeline items={timelineItems} />
        )}
      </SectionCard>
    </PageContainer>
  )
}
