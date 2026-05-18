import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants/routes'

export function NotFoundPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Página no encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">La ruta solicitada no existe en PRODENTIS.</p>
        <Button className="mt-8" asChild>
          <Link to={ROUTES.dashboard}>Ir al panel</Link>
        </Button>
      </div>
    </PageContainer>
  )
}
