import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileDown, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { SectionCard } from '@/components/shared/SectionCard'
import { AllergyAlert } from '@/components/shared/AllergyAlert'
import { Timeline, type TimelineItem } from '@/components/shared/Timeline'
import { FormField } from '@/components/forms/FormField'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OdontogramInteractive } from '@/modules/clinical-records/components/OdontogramInteractive'
import { PeriodontogramPanel } from '@/modules/clinical-records/components/PeriodontogramPanel'
import { RadiologyViewer } from '@/modules/clinical-records/components/RadiologyViewer'
import { SignaturePad } from '@/modules/clinical-records/components/SignaturePad'
import {
  CLINICAL_ENTRY_DEFAULTS,
  clinicalEntrySchema,
  type ClinicalEntryFormValues,
} from '@/modules/clinical-records/schemas/clinicalEntrySchema'
import {
  addEntry,
  addPeriodontogramEntry,
  createConsent,
  createOdontogramSnapshot,
  createPrescription,
  getOdontogram,
  listConsents,
  listConsentTemplates,
  listDiagnosticFiles,
  listEntriesByPatient,
  listMedications,
  listOdontogramSnapshots,
  listPeriodontogram,
  listPrescriptions,
  saveOdontogram,
  uploadDiagnosticFile,
} from '@/modules/clinical-records/services/clinicalRecordsService'
import { getPatient } from '@/modules/patients/services/patientsService'
import {
  downloadClinicalHistoryPdf,
  downloadConsentPdf,
  downloadPrescriptionPdf,
} from '@/lib/pdf/clinicalPdf'
import { useSessionStore } from '@/app/store/useSessionStore'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { ROUTES } from '@/lib/constants/routes'
import { formatDateTime } from '@/lib/formatters/date'
import type { OdontogramState, PrescriptionItem } from '@/types/domain'

const ENTRY_TYPES: Record<ClinicalEntryFormValues['type'], string> = {
  evolution: 'Evolución',
  diagnosis: 'Diagnóstico',
  procedure: 'Procedimiento',
  note: 'Nota',
  attachment: 'Adjunto (referencia)',
}

const EMPTY_RX_ITEM: PrescriptionItem = { name: '', dose: '', frequency: '', duration: '' }

export function ClinicalRecordPatientPage() {
  const { patientId } = useParams()
  const qc = useQueryClient()
  const user = useSessionStore((s) => s.user)
  const dentists = useAppDataStore((s) => s.dentists)
  const clinic = useAppDataStore((s) => s.clinic)
  const canWrite = user?.role === 'admin' || user?.role === 'dentist'

  const dentistId = dentists.find((d) => d.userId === user?.id)?.id ?? dentists[0]?.id
  const enabled = Boolean(patientId)
  const pid = patientId ?? ''

  const patientQ = useQuery({ queryKey: ['patient', patientId], queryFn: () => getPatient(pid), enabled })
  const entriesQ = useQuery({ queryKey: ['clinical', patientId], queryFn: () => listEntriesByPatient(pid), enabled })
  const odoQ = useQuery({ queryKey: ['odontogram', patientId], queryFn: () => getOdontogram(pid), enabled })
  const snapsQ = useQuery({ queryKey: ['odo-snapshots', patientId], queryFn: () => listOdontogramSnapshots(pid), enabled })
  const perioQ = useQuery({ queryKey: ['perio', patientId], queryFn: () => listPeriodontogram(pid), enabled })
  const rxQ = useQuery({ queryKey: ['prescriptions', patientId], queryFn: () => listPrescriptions(pid), enabled })
  const medsQ = useQuery({ queryKey: ['medications'], queryFn: listMedications })
  const filesQ = useQuery({ queryKey: ['diagnostic-files', patientId], queryFn: () => listDiagnosticFiles(pid), enabled })
  const consentsQ = useQuery({ queryKey: ['consents', patientId], queryFn: () => listConsents(pid), enabled })
  const templatesQ = useQuery({ queryKey: ['consent-templates'], queryFn: listConsentTemplates })

  // Consulta
  const form = useForm<ClinicalEntryFormValues>({
    resolver: zodResolver(clinicalEntrySchema),
    defaultValues: CLINICAL_ENTRY_DEFAULTS,
  })

  const addMut = useMutation({
    mutationFn: addEntry,
    onSuccess: () => {
      toast.success('Consulta registrada')
      qc.invalidateQueries({ queryKey: ['clinical', patientId] })
      form.reset(CLINICAL_ENTRY_DEFAULTS)
    },
  })

  function onSubmit(v: ClinicalEntryFormValues) {
    if (!patientId || !dentistId) return
    addMut.mutate({
      patientId,
      dentistId,
      type: v.type,
      title: v.title,
      content: v.content,
      diagnosisCode: v.diagnosisCode || undefined,
      procedureId: v.procedureId || undefined,
      chiefComplaint: v.chiefComplaint || undefined,
      currentIllness: v.currentIllness || undefined,
      physicalExam: v.physicalExam || undefined,
      diagnosis: v.diagnosis || undefined,
      treatmentPerformed: v.treatmentPerformed || undefined,
      indications: v.indications || undefined,
      nextVisit: v.nextVisit || undefined,
      toothId: v.toothId || undefined,
      signedBy: user?.name,
    })
  }

  // Odontograma
  const [odoDraft, setOdoDraft] = React.useState<OdontogramState | null>(null)
  const odo = odoDraft ?? odoQ.data ?? null

  const saveOdoMut = useMutation({
    mutationFn: saveOdontogram,
    onSuccess: () => {
      toast.success('Odontograma guardado')
      setOdoDraft(null)
      qc.invalidateQueries({ queryKey: ['odontogram', patientId] })
    },
  })

  const snapMut = useMutation({
    mutationFn: (state: OdontogramState) =>
      createOdontogramSnapshot(state, `Snapshot ${new Date().toLocaleString('es-AR')}`, dentistId),
    onSuccess: () => {
      toast.success('Snapshot del odontograma guardado')
      qc.invalidateQueries({ queryKey: ['odo-snapshots', patientId] })
    },
  })

  // Periodontograma
  const perioMut = useMutation({
    mutationFn: addPeriodontogramEntry,
    onSuccess: () => {
      toast.success('Medición registrada')
      qc.invalidateQueries({ queryKey: ['perio', patientId] })
    },
  })

  // Recetas
  const [rxItems, setRxItems] = React.useState<PrescriptionItem[]>([{ ...EMPTY_RX_ITEM }])
  const [rxDiagnosis, setRxDiagnosis] = React.useState('')
  const [rxIndications, setRxIndications] = React.useState('')

  const rxMut = useMutation({
    mutationFn: createPrescription,
    onSuccess: (rx) => {
      toast.success('Receta emitida')
      qc.invalidateQueries({ queryKey: ['prescriptions', patientId] })
      setRxItems([{ ...EMPTY_RX_ITEM }])
      setRxDiagnosis('')
      setRxIndications('')
      if (patientQ.data) {
        downloadPrescriptionPdf({
          clinic,
          patient: patientQ.data,
          dentist: dentists.find((d) => d.id === rx.dentistId),
          prescription: rx,
        })
      }
    },
  })

  function submitRx() {
    if (!patientId || !dentistId) return
    const items = rxItems.filter((i) => i.name.trim())
    if (items.length === 0) return toast.error('Agregue al menos un medicamento')
    rxMut.mutate({ patientId, dentistId, items, diagnosis: rxDiagnosis || undefined, indications: rxIndications || undefined })
  }

  const updateRxItem = (idx: number, patch: Partial<PrescriptionItem>) =>
    setRxItems((items) => items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  // Imágenes
  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadDiagnosticFile(pid, file),
    onSuccess: () => {
      toast.success('Archivo subido')
      qc.invalidateQueries({ queryKey: ['diagnostic-files', patientId] })
    },
  })

  // Consentimientos
  const [templateId, setTemplateId] = React.useState('')
  const [signerName, setSignerName] = React.useState('')
  const [signature, setSignature] = React.useState<string | null>(null)
  const [padKey, setPadKey] = React.useState(0)
  const templates = templatesQ.data ?? []
  const template = templates.find((t) => t.id === templateId)

  const consentMut = useMutation({
    mutationFn: createConsent,
    onSuccess: (c) => {
      toast.success('Consentimiento firmado')
      qc.invalidateQueries({ queryKey: ['consents', patientId] })
      setSignature(null)
      setPadKey((k) => k + 1)
      if (patientQ.data) downloadConsentPdf({ clinic, patient: patientQ.data, consent: c })
    },
  })

  function submitConsent() {
    if (!patientId || !template) return toast.error('Seleccione una plantilla')
    if (!signature) return toast.error('Falta la firma')
    const now = new Date().toISOString()
    consentMut.mutate({
      patientId,
      templateId: template.id,
      title: template.title,
      body: template.body,
      signatureDataUrl: signature,
      signedAt: now,
      signedByName: signerName || (patientQ.data ? `${patientQ.data.firstName} ${patientQ.data.lastName}` : ''),
      dentistId,
    })
  }

  if (patientQ.isLoading) return <LoadingState />
  if (patientQ.isError || !patientQ.data) return <ErrorState message="Paciente no encontrado." />

  const p = patientQ.data
  const fullName = `${p.firstName} ${p.lastName}`

  const timelineItems: TimelineItem[] = [
    ...(entriesQ.data ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      subtitle: ENTRY_TYPES[e.type],
      body: [e.chiefComplaint && `Motivo: ${e.chiefComplaint}`, e.diagnosis && `Dx: ${e.diagnosis}`, e.treatmentPerformed && `Tx: ${e.treatmentPerformed}`, e.content]
        .filter(Boolean)
        .join('\n'),
      createdAt: e.createdAt,
    })),
    ...(rxQ.data ?? []).map((r) => ({
      id: r.id,
      title: 'Receta emitida',
      subtitle: 'Receta',
      body: r.items.map((i) => i.name).join(', '),
      createdAt: r.createdAt,
      dotClassName: 'bg-sky-500',
    })),
    ...(consentsQ.data ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: 'Consentimiento',
      body: c.signedAt ? `Firmado por ${c.signedByName ?? ''}` : 'Pendiente de firma',
      createdAt: c.createdAt,
      dotClassName: 'bg-emerald-500',
    })),
    ...(snapsQ.data ?? []).map((s) => ({
      id: s.id,
      title: s.label,
      subtitle: 'Odontograma',
      createdAt: s.createdAt,
      dotClassName: 'bg-violet-500',
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <PageContainer>
      <PageTitle
        title={`Historia clínica — ${fullName}`}
        description="Consulta, odontograma, periodontograma, recetas, imágenes y consentimientos"
        actions={
          <>
            <Button
              variant="outline"
              type="button"
              onClick={() =>
                downloadClinicalHistoryPdf({
                  clinic,
                  patient: p,
                  entries: entriesQ.data ?? [],
                  dentists,
                  odontogram: odo,
                })
              }
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" asChild>
              <Link to={ROUTES.patient(p.id)}>Ficha del paciente</Link>
            </Button>
          </>
        }
      />
      <AllergyAlert allergies={p.allergies} />

      <Tabs defaultValue="consulta">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="consulta">Consulta</TabsTrigger>
          <TabsTrigger value="odo">Odontograma</TabsTrigger>
          <TabsTrigger value="perio">Periodontograma</TabsTrigger>
          <TabsTrigger value="rx">Recetas</TabsTrigger>
          <TabsTrigger value="img">Imágenes</TabsTrigger>
          <TabsTrigger value="consent">Consentimientos</TabsTrigger>
          <TabsTrigger value="timeline">Línea de tiempo</TabsTrigger>
        </TabsList>

        <TabsContent value="consulta" className="mt-4">
          <SectionCard title="Registrar consulta">
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="Tipo" htmlFor="type" required>
                  <Select value={form.watch('type')} onValueChange={(v) => form.setValue('type', v as ClinicalEntryFormValues['type'])}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ENTRY_TYPES).map(([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Título" htmlFor="title" error={form.formState.errors.title?.message} required className="sm:col-span-2">
                  <Input id="title" {...form.register('title')} />
                </FormField>
              </div>
              <FormField label="Motivo de consulta" htmlFor="chiefComplaint">
                <Input id="chiefComplaint" {...form.register('chiefComplaint')} />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Enfermedad actual" htmlFor="currentIllness">
                  <Textarea id="currentIllness" rows={3} {...form.register('currentIllness')} />
                </FormField>
                <FormField label="Examen físico / clínico" htmlFor="physicalExam">
                  <Textarea id="physicalExam" rows={3} {...form.register('physicalExam')} />
                </FormField>
                <FormField label="Diagnóstico" htmlFor="diagnosis">
                  <Textarea id="diagnosis" rows={2} {...form.register('diagnosis')} />
                </FormField>
                <FormField label="Tratamiento realizado" htmlFor="treatmentPerformed">
                  <Textarea id="treatmentPerformed" rows={2} {...form.register('treatmentPerformed')} />
                </FormField>
                <FormField label="Indicaciones" htmlFor="indications">
                  <Textarea id="indications" rows={2} {...form.register('indications')} />
                </FormField>
                <FormField label="Notas / evolución" htmlFor="content" error={form.formState.errors.content?.message}>
                  <Textarea id="content" rows={2} {...form.register('content')} />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <FormField label="Pieza (FDI)" htmlFor="toothId">
                  <Input id="toothId" placeholder="16" {...form.register('toothId')} />
                </FormField>
                <FormField label="Código diagnóstico" htmlFor="diagnosisCode">
                  <Input id="diagnosisCode" {...form.register('diagnosisCode')} />
                </FormField>
                <FormField label="ID procedimiento" htmlFor="procedureId">
                  <Input id="procedureId" {...form.register('procedureId')} />
                </FormField>
                <FormField label="Próxima cita" htmlFor="nextVisit">
                  <Input id="nextVisit" type="date" {...form.register('nextVisit')} />
                </FormField>
              </div>
              <Button type="submit" disabled={addMut.isPending || !canWrite}>
                {addMut.isPending ? 'Guardando…' : 'Agregar a la historia'}
              </Button>
              {!canWrite ? <p className="text-xs text-muted-foreground">Solo odontólogos y administradores pueden registrar consultas.</p> : null}
            </form>
          </SectionCard>
        </TabsContent>

        <TabsContent value="odo" className="mt-4 space-y-4">
          <SectionCard
            title="Odontograma"
            description="FDI adulto y pediátrico, por superficie"
            headerRight={
              odoDraft ? (
                <Button type="button" size="sm" disabled={saveOdoMut.isPending} onClick={() => saveOdoMut.mutate(odoDraft)}>
                  {saveOdoMut.isPending ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              ) : null
            }
          >
            {odo ? (
              <OdontogramInteractive
                state={odo}
                readOnly={!canWrite}
                onChange={setOdoDraft}
                onSnapshot={(s) => snapMut.mutate(s)}
                snapshotPending={snapMut.isPending}
              />
            ) : (
              <LoadingState message="Cargando odontograma…" />
            )}
          </SectionCard>
          <SectionCard title="Snapshots guardados">
            {(snapsQ.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay snapshots.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {snapsQ.data!.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span>
                      {s.label} <span className="text-xs text-muted-foreground">· {formatDateTime(s.createdAt)}</span>
                    </span>
                    {canWrite && odo ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setOdoDraft({ ...odo, teeth: s.teeth, updatedAt: new Date().toISOString() })}
                      >
                        Cargar
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="perio" className="mt-4">
          <SectionCard title="Periodontograma" description="Profundidad de sondaje, movilidad, sangrado y placa">
            <PeriodontogramPanel
              patientId={p.id}
              entries={perioQ.data ?? []}
              saving={perioMut.isPending}
              readOnly={!canWrite}
              onSave={(input) => perioMut.mutate(input)}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="rx" className="mt-4 grid gap-6 lg:grid-cols-2">
          <SectionCard title="Nueva receta">
            <div className="space-y-4">
              {rxItems.map((it, idx) => (
                <div key={idx} className="space-y-2 rounded-md border p-3">
                  <div className="flex gap-2">
                    <Select
                      value=""
                      onValueChange={(id) => {
                        const m = medsQ.data?.find((x) => x.id === id)
                        if (m) updateRxItem(idx, { medicationId: m.id, name: `${m.name} ${m.presentation}`.trim(), dose: m.defaultDose ?? it.dose })
                      }}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Vademécum" />
                      </SelectTrigger>
                      <SelectContent>
                        {(medsQ.data ?? []).map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} {m.presentation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Medicamento" value={it.name} onChange={(e) => updateRxItem(idx, { name: e.target.value })} />
                    <Button type="button" size="icon" variant="ghost" onClick={() => setRxItems((l) => (l.length > 1 ? l.filter((_, i) => i !== idx) : l))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input placeholder="Dosis" value={it.dose} onChange={(e) => updateRxItem(idx, { dose: e.target.value })} />
                    <Input placeholder="Frecuencia" value={it.frequency} onChange={(e) => updateRxItem(idx, { frequency: e.target.value })} />
                    <Input placeholder="Duración" value={it.duration} onChange={(e) => updateRxItem(idx, { duration: e.target.value })} />
                  </div>
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={() => setRxItems((l) => [...l, { ...EMPTY_RX_ITEM }])}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar medicamento
              </Button>
              <FormField label="Diagnóstico">
                <Input value={rxDiagnosis} onChange={(e) => setRxDiagnosis(e.target.value)} />
              </FormField>
              <FormField label="Indicaciones">
                <Textarea rows={3} value={rxIndications} onChange={(e) => setRxIndications(e.target.value)} />
              </FormField>
              <Button type="button" disabled={rxMut.isPending || !canWrite} onClick={submitRx}>
                {rxMut.isPending ? 'Emitiendo…' : 'Emitir receta y descargar PDF'}
              </Button>
            </div>
          </SectionCard>
          <SectionCard title="Recetas emitidas">
            {(rxQ.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin recetas.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {rxQ.data!.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                    <div>
                      <p className="font-medium">{r.items.map((i) => i.name).join(', ')}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadPrescriptionPdf({ clinic, patient: p, dentist: dentists.find((d) => d.id === r.dentistId), prescription: r })
                      }
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="img" className="mt-4">
          <SectionCard title="Imágenes diagnósticas" description="Radiografías y fotografías con zoom, brillo y contraste">
            <RadiologyViewer
              files={filesQ.data ?? []}
              uploading={uploadMut.isPending}
              onUpload={canWrite || user?.role === 'assistant' ? (f) => uploadMut.mutate(f) : undefined}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="consent" className="mt-4 grid gap-6 lg:grid-cols-2">
          <SectionCard title="Nuevo consentimiento">
            <div className="space-y-4">
              <FormField label="Plantilla" required>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              {template ? (
                <p className="max-h-40 overflow-y-auto whitespace-pre-line rounded-md border bg-muted/30 p-3 text-xs">{template.body}</p>
              ) : null}
              <FormField label="Firmante" hint="Por defecto: el paciente">
                <Input placeholder={fullName} value={signerName} onChange={(e) => setSignerName(e.target.value)} />
              </FormField>
              <SignaturePad key={padKey} onChange={setSignature} />
              <Button type="button" disabled={consentMut.isPending || !template || !signature} onClick={submitConsent}>
                {consentMut.isPending ? 'Guardando…' : 'Firmar y descargar PDF'}
              </Button>
            </div>
          </SectionCard>
          <SectionCard title="Consentimientos firmados">
            {(consentsQ.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin consentimientos.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {consentsQ.data!.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.signedByName} · {formatDateTime(c.signedAt ?? c.createdAt)}
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => downloadConsentPdf({ clinic, patient: p, consent: c })}>
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <SectionCard title="Línea de tiempo clínica">
            {entriesQ.isLoading ? (
              <LoadingState message="Cargando historial…" />
            ) : timelineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay registros para este paciente.</p>
            ) : (
              <Timeline items={timelineItems} />
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
