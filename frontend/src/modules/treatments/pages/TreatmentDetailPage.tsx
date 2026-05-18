import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { InfoGrid } from '@/components/shared/InfoGrid'
import { TreatmentStatusBadge } from '@/components/shared/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getTreatment, registerProgress, setTreatmentStatus } from '@/modules/treatments/services/treatmentsService'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { ROUTES } from '@/lib/constants/routes'
import { formatCurrency } from '@/lib/formatters/currency'
import { formatDate } from '@/lib/formatters/date'

export function TreatmentDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const patients = useAppDataStore((s) => s.patients)
  const procedures = useAppDataStore((s) => s.procedures)

  const q = useQuery({
    queryKey: ['treatment', id],
    queryFn: () => getTreatment(id!),
    enabled: Boolean(id),
  })

  const [sessions, setSessions] = React.useState(0)

  React.useEffect(() => {
    if (q.data) setSessions(q.data.sessionsDone)
  }, [q.data])

  const statusMut = useMutation({
    mutationFn: ({ tid, status }: { tid: string; status: Parameters<typeof setTreatmentStatus>[1] }) =>
      setTreatmentStatus(tid, status),
    onSuccess: () => {
      toast.success('Estado actualizado')
      qc.invalidateQueries({ queryKey: ['treatment', id] })
      qc.invalidateQueries({ queryKey: ['treatments'] })
    },
  })

  const progressMut = useMutation({
    mutationFn: ({ tid, done }: { tid: string; done: number }) => registerProgress(tid, done),
    onSuccess: () => {
      toast.success('Avance registrado')
      qc.invalidateQueries({ queryKey: ['treatment', id] })
      qc.invalidateQueries({ queryKey: ['treatments'] })
    },
  })

  if (q.isLoading) return <LoadingState />
  if (q.isError || !q.data) return <ErrorState message="Tratamiento no encontrado." />

  const t = q.data
  const patient = patients.find((p) => p.id === t.patientId)
  const proc = procedures.find((p) => p.id === t.procedureId)

  return (
    <PageContainer>
      <PageTitle
        title={proc?.name ?? 'Tratamiento'}
        description={patient ? `${patient.firstName} ${patient.lastName}` : t.patientId}
        actions={
          <Button variant="outline" asChild>
            <Link to={ROUTES.treatments}>Volver</Link>
          </Button>
        }
      />
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <InfoGrid
          items={[
            { label: 'Estado', value: <TreatmentStatusBadge status={t.status} /> },
            { label: 'Costo', value: formatCurrency(t.cost) },
            { label: 'Inicio', value: formatDate(t.startDate) },
            { label: 'Sesiones', value: `${t.sessionsDone} / ${t.sessionsPlanned}` },
            { label: 'Notas', value: t.notes || '—' },
          ]}
        />
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => id && statusMut.mutate({ tid: id, status: 'in_progress' })}>
            Marcar en curso
          </Button>
          <Button onClick={() => id && statusMut.mutate({ tid: id, status: 'completed' })}>Marcar completado</Button>
        </div>
        <div className="mt-6 border-t pt-4">
          <p className="mb-2 text-sm font-medium">Registrar avance de sesiones</p>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="text-xs text-muted-foreground" htmlFor="sess">
                Sesiones realizadas
              </label>
              <Input
                id="sess"
                type="number"
                min={0}
                max={t.sessionsPlanned}
                value={sessions || t.sessionsDone}
                onChange={(e) => setSessions(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <Button
              onClick={() =>
                id && progressMut.mutate({ tid: id, done: sessions || t.sessionsDone })
              }
              disabled={progressMut.isPending}
            >
              Guardar avance
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
