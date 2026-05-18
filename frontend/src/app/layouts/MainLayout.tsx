import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { AppHeader } from '@/components/shared/AppHeader'
import { useSessionStore } from '@/app/store/useSessionStore'
import { useUiStore } from '@/app/store/useUiStore'
import { cn } from '@/lib/utils/cn'

export function MainLayout() {
  const user = useSessionStore((s) => s.user)
  const logout = useSessionStore((s) => s.logout)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar role={user.role} />
      <div className={cn('flex min-h-screen flex-col transition-[margin] duration-200', collapsed ? 'lg:ml-[72px]' : 'lg:ml-56')}>
        <AppHeader user={user} onLogout={logout} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
