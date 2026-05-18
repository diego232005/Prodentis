import type { UserRole } from '@/types/common'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
}
