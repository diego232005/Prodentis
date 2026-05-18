import { Link, useNavigate } from 'react-router-dom'
import { Bell, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ROUTES } from '@/lib/constants/routes'
import { ROLE_LABELS } from '@/lib/constants/roles'
import type { SessionUser } from '@/modules/auth/types'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'

interface AppHeaderProps {
  user: SessionUser
  onLogout: () => void
}

export function AppHeader({ user, onLogout }: AppHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
        <Bell className="h-4 w-4" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden max-w-[140px] truncate sm:inline">{user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-0.5">
              <span className="font-medium">{user.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{ROLE_LABELS[user.role]}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={ROUTES.profile}>Mi perfil</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              onLogout()
              navigate(ROUTES.login)
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
