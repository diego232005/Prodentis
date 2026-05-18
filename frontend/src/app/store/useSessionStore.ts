import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/types/common'
import type { SessionUser } from '@/modules/auth/types'

interface SessionState {
  user: SessionUser | null
  setUser: (user: SessionUser | null) => void
  logout: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'prodentis-session' },
  ),
)

export function useCurrentRole(): UserRole | null {
  return useSessionStore((s) => s.user?.role ?? null)
}
