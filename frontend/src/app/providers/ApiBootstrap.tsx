import * as React from 'react'
import { hydrateAppFromApi } from '@/lib/api/bootstrap'
import { ApiError } from '@/lib/api/errors'

export function ApiBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    hydrateAppFromApi()
      .then(() => setReady(true))
      .catch((e: unknown) => {
        const msg = e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor'
        setError(msg)
        setReady(true)
      })
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Cargando datos del consultorio…
      </div>
    )
  }

  return (
    <>
      {error ? (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
          {error} — datos locales activos. Iniciá el backend para PostgreSQL.
        </div>
      ) : null}
      {children}
    </>
  )
}
