import * as React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Package,
  PieChart,
  Settings,
  Stethoscope,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/lib/constants/routes'
import type { UserRole } from '@/types/common'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/app/store/useUiStore'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ProDentisLogo } from '@/components/shared/ProDentisLogo'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  roles: UserRole[]
}

const items: NavItem[] = [
  { to: ROUTES.dashboard, label: 'Panel', icon: LayoutDashboard, roles: ['admin', 'receptionist', 'dentist', 'assistant'] },
  { to: ROUTES.patients, label: 'Pacientes', icon: Users, roles: ['admin', 'receptionist', 'dentist', 'assistant'] },
  { to: ROUTES.appointments, label: 'Citas', icon: CalendarDays, roles: ['admin', 'receptionist', 'dentist', 'assistant'] },
  { to: ROUTES.clinicalRecords, label: 'Historia clínica', icon: Stethoscope, roles: ['admin', 'dentist'] },
  { to: ROUTES.treatments, label: 'Tratamientos', icon: Activity, roles: ['admin', 'dentist', 'assistant'] },
  { to: ROUTES.billing, label: 'Facturación', icon: FileText, roles: ['admin', 'receptionist'] },
  { to: ROUTES.inventory, label: 'Inventario', icon: Package, roles: ['admin', 'assistant'] },
  { to: ROUTES.reports, label: 'Reportes', icon: PieChart, roles: ['admin', 'receptionist', 'dentist'] },
  { to: ROUTES.settings, label: 'Configuración', icon: Settings, roles: ['admin'] },
]

export function AppSidebar({ role }: { role: UserRole }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)

  const visible = items.filter((i) => i.roles.includes(role))

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-card transition-[width] duration-200',
          collapsed ? 'w-[72px]' : 'w-56',
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-2">
          {collapsed ? (
            <div className="flex h-9 w-full items-center justify-center">
              <ProDentisLogo variant="sidebar-icon" className="mx-auto" />
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-1">
              <ProDentisLogo variant="sidebar" className="max-w-full" />
              <p className="truncate text-xs text-muted-foreground">Consultorio</p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {visible.map((item) => {
            const Icon = item.icon
            const link = (
              <NavLink
                to={item.to}
                end={item.to === ROUTES.dashboard}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center px-0',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {!collapsed ? <span>{item.label}</span> : null}
              </NavLink>
            )
            if (collapsed) {
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }
            return <div key={item.to}>{link}</div>
          })}
        </nav>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className={cn('w-full justify-start', collapsed && 'justify-center px-0')} onClick={toggle}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed ? <span className="ml-2">Colapsar menú</span> : null}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
