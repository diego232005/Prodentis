import { apiClient } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { mockDelay } from '@/lib/api/delay'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import type { MockUser } from '@/types/domain'
import type { SessionUser } from '@/modules/auth/types'

interface LoginResponse {
  user?: SessionUser
  token?: string
}

function localLogin(email: string, password: string): SessionUser {
  const users = useAppDataStore.getState().users
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
  if (!user) throw new ApiError('Credenciales inválidas', 401)
  return toSessionUser(user)
}

/** POST /auth/login; si el endpoint no existe o el servidor no responde, usa usuarios locales. */
export async function login(email: string, password: string): Promise<SessionUser> {
  try {
    const res = await apiClient.post<LoginResponse | SessionUser>('/auth/login', { email, password })
    const user = 'user' in res && res.user ? res.user : (res as SessionUser)
    if (!user?.id || !user.role) throw new ApiError('Respuesta de login inválida', 502)
    return { id: user.id, email: user.email, name: user.name, role: user.role }
  } catch (e) {
    const recoverable = e instanceof ApiError && (e.status === 404 || e.status >= 500)
    if (!recoverable) throw e
    await mockDelay(300)
    return localLogin(email, password)
  }
}

export function toSessionUser(user: MockUser): SessionUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

export async function requestPasswordReset(_email: string): Promise<void> {
  await mockDelay(600)
}
