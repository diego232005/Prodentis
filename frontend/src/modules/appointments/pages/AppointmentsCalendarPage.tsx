import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { SectionCard } from '@/components/shared/SectionCard'
import { LoadingState } from '@/components/feedback/LoadingState'
import { CalendarView, type CalendarViewMode } from '@/modules/appointments/components/CalendarView'
import { ReceptionBoard } from '@/modules/appointments/components/ReceptionBoard'
import { listAppointments } from '@/modules/appointments/services/appointmentsService'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { ROUTES } from '@/lib/constants/routes'

export function AppointmentsCalendarPage() {
  const navigate = useNavigate()
  const q = useQuery({ queryKey: ['appointments'], queryFn: listAppointments })
  const patients = useAppDataStore((s) => s.patients)
  const dentists = useAppDataStore((s) => s.dentists)
  const chairs = useAppDataStore((s) => s.chairs)
  const blocks = useAppDataStore((s) => s.dentistBlocks)
  const [date, setDate] = React.useState(() => new Date())
  const [view, setView] = React.useState<CalendarViewMode>('week')

  const getPatientName = (id: string) => {
    const p = patients.find((x) => x.id === id)
    return p ? `${p.firstName} ${p.lastName}` : id
  }

  if (q.isLoading) return <LoadingState />

  const appointments = q.data ?? []
  const open = (id: string) => navigate(ROUTES.appointment(id))

  return (
    <PageContainer>
      <PageTitle title="Agenda" description="Recepción del día y calendario (día, semana, mes, por doctor)" />
      <SectionCard title="Recepción de hoy" description="Gestione llegada, sala de espera y atención">
        <ReceptionBoard
          appointments={appointments}
          getPatientName={getPatientName}
          getDentistName={(id) => dentists.find((d) => d.id === id)?.name ?? id}
          getChairName={(id) => chairs.find((c) => c.id === id)?.name ?? ''}
          onSelectAppointment={open}
        />
      </SectionCard>
      <CalendarView
        appointments={appointments}
        getPatientName={getPatientName}
        dentists={dentists}
        blocks={blocks}
        date={date}
        onDateChange={setDate}
        view={view}
        onViewChange={setView}
        onSelectAppointment={open}
      />
    </PageContainer>
  )
}
