import { Navigate, Outlet } from 'react-router-dom'
import { useSessionStore } from '@/app/store/useSessionStore'
import { ROUTES } from '@/lib/constants/routes'

export function GuestRoute() {
  const user = useSessionStore((s) => s.user)
  if (user) return <Navigate to={ROUTES.dashboard} replace />
  return <Outlet />
}
