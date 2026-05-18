import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { LoadingState } from '@/components/feedback/LoadingState'
import { CalendarView } from '@/modules/appointments/components/CalendarView'
import { listAppointments } from '@/modules/appointments/services/appointmentsService'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import { ROUTES } from '@/lib/constants/routes'

export function AppointmentsCalendarPage() {
  const navigate = useNavigate()
  const q = useQuery({ queryKey: ['appointments'], queryFn: listAppointments })
  const patients = useAppDataStore((s) => s.patients)
  const [month, setMonth] = React.useState(() => new Date())

  const getPatientName = (id: string) => {
    const p = patients.find((x) => x.id === id)
    return p ? `${p.firstName} ${p.lastName}` : id
  }

  if (q.isLoading) return <LoadingState />

  return (
    <PageContainer>
      <PageTitle title="Calendario de citas" description="Vista mensual con acceso rápido al detalle" />
      <CalendarView
        appointments={q.data ?? []}
        getPatientName={getPatientName}
        month={month}
        onMonthChange={setMonth}
        onSelectAppointment={(id) => navigate(ROUTES.appointment(id))}
      />
    </PageContainer>
  )
}
