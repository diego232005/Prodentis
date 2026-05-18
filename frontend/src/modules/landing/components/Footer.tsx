import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ProDentisLogo } from '@/components/shared/ProDentisLogo'
import { ROUTES } from '@/lib/constants/routes'

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center">
          <ProDentisLogo variant="footer" />
        </div>
        <p className="max-w-xl">
          © {new Date().getFullYear()} PRODENTIS. Plataforma de gestión para consultorios odontológicos.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.login}>Área privada</Link>
          </Button>
        </div>
      </div>
    </footer>
  )
}
