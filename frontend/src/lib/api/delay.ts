export function mockDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

import { ApiError } from '@/lib/api/errors'

/** @deprecated Usar ApiError */
export const MockApiError = ApiError
