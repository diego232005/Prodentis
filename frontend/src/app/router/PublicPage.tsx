import { Navigate } from 'react-router-dom'
import { useSessionStore } from '@/app/store/useSessionStore'
import { LandingPage } from '@/modules/landing/pages/LandingPage'
import { ROUTES } from '@/lib/constants/routes'

/** Landing en `/`; si ya hay sesión, al panel. */
export function PublicPage() {
  const user = useSessionStore((s) => s.user)
  if (user) return <Navigate to={ROUTES.dashboard} replace />
  return <LandingPage />
}
