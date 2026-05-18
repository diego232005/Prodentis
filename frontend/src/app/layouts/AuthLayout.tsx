import { Outlet } from 'react-router-dom'
import { ProDentisLogo } from '@/components/shared/ProDentisLogo'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <ProDentisLogo variant="auth" />
          <p className="text-sm text-muted-foreground">Gestión clínica odontológica</p>
        </div>
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
