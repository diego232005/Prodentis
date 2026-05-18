import axios, { type AxiosError } from 'axios'
import { ApiError } from '@/lib/api/errors'

const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
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
