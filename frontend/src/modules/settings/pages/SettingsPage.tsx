import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { SectionCard } from '@/components/shared/SectionCard'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { clinicSettingsSchema, type ClinicSettingsFormValues } from '@/modules/settings/schemas/settingsSchema'
import { getClinicSettings, listStaffAccounts, updateClinicSettings, updateStaffAccount } from '@/modules/settings/services/settingsService'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ROLE_LABELS } from '@/lib/constants/roles'
import { useUiStore } from '@/app/store/useUiStore'
import { Label } from '@/components/ui/label'
import { useContactInboxStore } from '@/app/store/useContactInboxStore'
import { formatDateTime } from '@/lib/formatters/date'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'

export function SettingsPage() {
  const qc = useQueryClient()
  const clinicQ = useQuery({ queryKey: ['clinic-settings'], queryFn: getClinicSettings })
  const staffQ = useQuery({ queryKey: ['staff'], queryFn: listStaffAccounts })
  const compactTables = useUiStore((s) => s.compactTables)
  const setCompactTables = useUiStore((s) => s.setCompactTables)
  const contactMessages = useContactInboxStore((s) => s.messages)
  const clearContactInbox = useContactInboxStore((s) => s.clearAll)
  const [clearInboxOpen, setClearInboxOpen] = React.useState(false)

  const form = useForm<ClinicSettingsFormValues>({
    resolver: zodResolver(clinicSettingsSchema),
    defaultValues: {
      name: '',
      taxId: '',
      phone: '',
      email: '',
      address: '',
      openingHours: '',
    },
  })

  React.useEffect(() => {
    if (clinicQ.data) form.reset(clinicQ.data)
  }, [clinicQ.data, form])

  const saveClinic = useMutation({
    mutationFn: updateClinicSettings,
    onSuccess: () => {
      toast.success('Datos del consultorio actualizados')
      qc.invalidateQueries({ queryKey: ['clinic-settings'] })
    },
  })

  const toggleStaff = useMutation({
    mutationFn: updateStaffAccount,
    onSuccess: () => {
      toast.success('Usuario actualizado')
      qc.invalidateQueries({ queryKey: ['staff'] })
    },
  })

  if (clinicQ.isLoading) return <LoadingState />

  return (
    <PageContainer>
      <PageTitle title="Configuración" description="Datos del consultorio, usuarios y preferencias" />
      <form className="max-w-2xl space-y-4 rounded-lg border bg-card p-6 shadow-sm" onSubmit={form.handleSubmit((v) => saveClinic.mutate(v))} noValidate>
        <h3 className="text-sm font-semibold">Consultorio</h3>
        <FormField label="Nombre" required error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} />
        </FormField>
        <FormField label="Identificación fiscal" required error={form.formState.errors.taxId?.message}>
          <Input {...form.register('taxId')} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Teléfono" required error={form.formState.errors.phone?.message}>
            <Input {...form.register('phone')} />
          </FormField>
          <FormField label="Correo" required error={form.formState.errors.email?.message}>
            <Input type="email" {...form.register('email')} />
          </FormField>
        </div>
        <FormField label="Dirección" required error={form.formState.errors.address?.message}>
          <Textarea rows={2} {...form.register('address')} />
        </FormField>
        <FormField label="Horarios" required error={form.formState.errors.openingHours?.message}>
          <Textarea rows={2} {...form.register('openingHours')} />
        </FormField>
        <Button type="submit" disabled={saveClinic.isPending}>
          {saveClinic.isPending ? 'Guardando…' : 'Guardar consultorio'}
        </Button>
      </form>
      <SectionCard
        title="Mensajes del formulario web"
        description="Recibidos desde la landing pública. Persistencia local (localStorage) hasta conectar backend."
        headerRight={
          contactMessages.length > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setClearInboxOpen(true)}>
              Vaciar bandeja
            </Button>
          ) : null
        }
      >
        {contactMessages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay mensajes de contacto.</p>
        ) : (
          <ul className="space-y-4">
            {contactMessages.map((m) => (
              <li key={m.id} className="rounded-lg border bg-muted/20 p-4 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-foreground">{m.subject}</p>
                  <time className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</time>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {m.name} ·{' '}
                  <a href={`mailto:${m.email}`} className="text-primary hover:underline">
                    {m.email}
                  </a>
                  {m.phone ? (
                    <>
                      {' '}
                      ·{' '}
                      <a href={`tel:${m.phone.replace(/\s/g, '')}`} className="text-primary hover:underline">
                        {m.phone}
                      </a>
                    </>
                  ) : null}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-foreground/90">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      <SectionCard title="Usuarios y roles" description="Gestione usuarios activos y sus perfiles">
        <ul className="space-y-2 text-sm">
          {(staffQ.data ?? []).map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground">
                  {u.email} · {ROLE_LABELS[u.role]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Activo</span>
                <Switch
                  checked={u.active}
                  onCheckedChange={(checked) => toggleStaff.mutate({ ...u, active: checked })}
                />
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Preferencias visuales">
        <div className="flex items-center justify-between">
          <Label htmlFor="compact">Tablas compactas (mock UI)</Label>
          <Switch id="compact" checked={compactTables} onCheckedChange={setCompactTables} />
        </div>
      </SectionCard>
      <ConfirmDialog
        open={clearInboxOpen}
        onOpenChange={setClearInboxOpen}
        title="¿Vaciar todos los mensajes?"
        description="Se eliminarán del navegador los mensajes guardados localmente. Esta acción no se puede deshacer."
        confirmLabel="Vaciar"
        variant="destructive"
        onConfirm={() => {
          clearContactInbox()
          toast.success('Bandeja vaciada')
        }}
      />
    </PageContainer>
  )
}
