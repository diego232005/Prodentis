import { Link } from 'react-router-dom'
import { ArrowRight, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ProDentisLogo } from '@/components/shared/ProDentisLogo'
import { ROUTES } from '@/lib/constants/routes'
import { NAV_ANCHOR_LINKS } from '@/modules/landing/components/navItems'

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 lg:px-8">
        <Link to={ROUTES.home} className="flex items-center py-1">
          <ProDentisLogo variant="navbar" />
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Secciones">
          {NAV_ANCHOR_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button className="hidden sm:inline-flex" asChild>
            <Link to={ROUTES.login}>
              Ingresar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Abrir menú">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-6">
              <SheetHeader className="text-left">
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              {NAV_ANCHOR_LINKS.map((item) => (
                <a key={item.href} href={item.href} className="text-sm font-medium">
                  {item.label}
                </a>
              ))}
              <Button asChild>
                <Link to={ROUTES.login}>Ingresar al sistema</Link>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
