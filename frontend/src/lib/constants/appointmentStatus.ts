import type { AppointmentStatus } from '@/types/common'

export const appointmentLabels: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  waiting: 'En sala de espera',
  in_progress: 'En atención',
  completed: 'Finalizada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
}
