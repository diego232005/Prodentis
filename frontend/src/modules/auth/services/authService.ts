import { mockDelay, MockApiError } from '@/lib/api/delay'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import type { MockUser } from '@/types/domain'
import type { SessionUser } from '@/modules/auth/types'

/** Prepared for future: replace body with fetch('/api/auth/login') */
export async function login(email: string, password: string): Promise<SessionUser> {
  await mockDelay(500)
  const users = useAppDataStore.getState().users
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
  if (!user) {
    throw new MockApiError('Credenciales inválidas', 401)
  }
  return toSessionUser(user)
}

export function toSessionUser(user: MockUser): SessionUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

export async function requestPasswordReset(_email: string): Promise<void> {
  await mockDelay(600)
}

