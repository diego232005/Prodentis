import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessionStore } from '@/app/store/useSessionStore'
import { ROUTES } from '@/lib/constants/routes'

export function ProtectedRoute() {
  const user = useSessionStore((s) => s.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
