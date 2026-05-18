import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/forms/FormField'
import { loginSchema, type LoginFormValues } from '@/modules/auth/schemas/loginSchema'
import { login } from '@/modules/auth/services/authService'
import { useSessionStore } from '@/app/store/useSessionStore'
import { ROUTES } from '@/lib/constants/routes'
import { MockApiError } from '@/lib/api/delay'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useSessionStore((s) => s.setUser)
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.dashboard

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    setLoading(true)
    try {
      const user = await login(values.email, values.password)
      setUser(user)
      toast.success('Sesión iniciada')
      navigate(from, { replace: true })
    } catch (e) {
      const msg = e instanceof MockApiError ? e.message : 'No se pudo iniciar sesión'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Iniciar sesión</CardTitle>
        <CardDescription>Ingrese sus credenciales de PRODENTIS (entorno simulado).</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField label="Correo electrónico" htmlFor="email" error={form.formState.errors.email?.message} required>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </FormField>
          <FormField label="Contraseña" htmlFor="password" error={form.formState.errors.password?.message} required>
            <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
          </FormField>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to={ROUTES.forgotPassword} className="text-primary hover:underline">
            ¿Olvidó su contraseña?
          </Link>
          <span className="mx-2 text-border">·</span>
          <Link to={ROUTES.home} className="text-primary hover:underline">
            Volver al inicio
          </Link>
        </p>
        <div className="mt-6 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Usuarios de prueba</p>
          <ul className="mt-2 space-y-1">
            <li>admin@prodentis.com / admin123</li>
            <li>recepcion@prodentis.com / recep123</li>
            <li>odontologo@prodentis.com / dent123</li>
            <li>auxiliar@prodentis.com / aux123</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
