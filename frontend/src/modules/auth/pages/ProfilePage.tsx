import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { userSettingsSchema, type UserSettingsFormValues } from '@/modules/settings/schemas/settingsSchema'
import { useSessionStore } from '@/app/store/useSessionStore'
import { ROLE_LABELS } from '@/lib/constants/roles'

export function ProfilePage() {
  const user = useSessionStore((s) => s.user)
  const setUser = useSessionStore((s) => s.setUser)

  const form = useForm<UserSettingsFormValues>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  })

  React.useEffect(() => {
    if (user) form.reset({ name: user.name, email: user.email })
  }, [user, form])

  function onSubmit(values: UserSettingsFormValues) {
    if (!user) return
    setUser({ ...user, name: values.name, email: values.email })
    toast.success('Perfil actualizado (solo en esta sesión mock)')
  }

  return (
    <PageContainer>
      <PageTitle title="Mi perfil" description={user ? ROLE_LABELS[user.role] : ''} />
      <form className="mx-auto max-w-md space-y-4 rounded-lg border bg-card p-6 shadow-sm" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField label="Nombre" required error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} />
        </FormField>
        <FormField label="Correo" required error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register('email')} />
        </FormField>
        <Button type="submit">Guardar cambios</Button>
      </form>
    </PageContainer>
  )
}
