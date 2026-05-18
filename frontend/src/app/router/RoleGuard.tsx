import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessionStore } from '@/app/store/useSessionStore'
import { getAllowedRolesForPath } from '@/lib/constants/roles'
import { ROUTES } from '@/lib/constants/routes'

export function RoleGuard() {
  const user = useSessionStore((s) => s.user)
  const location = useLocation()

  if (!user) return <Navigate to={ROUTES.login} replace />

  const allowed = getAllowedRolesForPath(location.pathname)
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return <Outlet />
}
