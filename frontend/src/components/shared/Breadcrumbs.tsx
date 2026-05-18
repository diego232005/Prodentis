import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { Fragment } from 'react'
import { ROUTES } from '@/lib/constants/routes'

const LABELS: Record<string, string> = {
  dashboard: 'Panel',
  patients: 'Pacientes',
  new: 'Nuevo',
  edit: 'Editar',
  appointments: 'Citas',
  calendar: 'Calendario',
  'clinical-records': 'Historia clínica',
  treatments: 'Tratamientos',
  billing: 'Facturación',
  inventory: 'Inventario',
  reports: 'Reportes',
  settings: 'Configuración',
  profile: 'Perfil',
}

function segmentLabel(segment: string): string {
  if (LABELS[segment]) return LABELS[segment]
  if (/^[a-z0-9-]+$/i.test(segment) && segment.length > 8) return 'Detalle'
  return segment
}

export function Breadcrumbs() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)

  const crumbs: { to: string; label: string }[] = []
  let acc = ''
  for (const part of parts) {
    acc += `/${part}`
    crumbs.push({ to: acc, label: segmentLabel(part) })
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Migas de pan">
      <Link
        to={ROUTES.dashboard}
        className="flex items-center gap-1 rounded-md p-1 hover:bg-muted hover:text-foreground"
        aria-label="Inicio"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((c, i) => (
        <Fragment key={c.to}>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{c.label}</span>
          ) : (
            <Link to={c.to} className="rounded-md px-1 py-0.5 hover:bg-muted hover:text-foreground">
              {c.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
