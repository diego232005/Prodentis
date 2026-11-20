import axios, { type AxiosError } from 'axios'
import { ApiError } from '@/lib/api/errors'
import { useSessionStore } from '@/app/store/useSessionStore'

const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const user = useSessionStore.getState().user
  if (user) {
    config.headers.set('X-User-Id', user.id)
    config.headers.set('X-User-Role', user.role)
    config.headers.set('X-User-Name', encodeURIComponent(user.name))
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string; details?: unknown }>) => {
    const status = err.response?.status ?? 500
    const message = err.response?.data?.error ?? err.message ?? 'Error de red'
    throw new ApiError(message, status, err.response?.data?.details)
  },
)

export const apiClient = {
  get: <T>(path: string) => http.get<T>(path).then((r) => r.data),
  post: <T>(path: string, body: unknown) => http.post<T>(path, body).then((r) => r.data),
  put: <T>(path: string, body: unknown) => http.put<T>(path, body).then((r) => r.data),
  delete: (path: string) => http.delete(path).then(() => undefined),
}
