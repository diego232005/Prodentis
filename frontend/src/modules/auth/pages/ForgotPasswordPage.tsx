import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/forms/FormField'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/modules/auth/schemas/loginSchema'
import { requestPasswordReset } from '@/modules/auth/services/authService'
import { ROUTES } from '@/lib/constants/routes'

export function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setLoading(true)
    try {
      await requestPasswordReset(values.email)
      setSent(true)
      toast.success('Si el correo existe, recibirá instrucciones (simulado).')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Recuperar contraseña</CardTitle>
        <CardDescription>Flujo simulado — no se envía correo real.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-muted-foreground">
            Listo. En producción aquí enviaríamos un enlace al correo indicado.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FormField label="Correo electrónico" htmlFor="email" error={form.formState.errors.email?.message} required>
              <Input id="email" type="email" {...form.register('email')} />
            </FormField>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar instrucciones'}
            </Button>
          </form>
        )}
        <Button variant="link" className="mt-4 px-0" asChild>
          <Link to={ROUTES.login}>Volver al login</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
