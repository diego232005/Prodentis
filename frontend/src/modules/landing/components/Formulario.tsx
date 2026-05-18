import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/forms/FormField'
import { Separator } from '@/components/ui/separator'
import { contactFormSchema, type ContactFormValues } from '@/modules/landing/schemas/contactSchema'
import { submitContactMessage } from '@/modules/landing/services/contactService'
import { useAppDataStore } from '@/app/store/useAppDataStore'

export function Formulario() {
  const clinic = useAppDataStore((s) => s.clinic)
  const [lastSubmissionAt, setLastSubmissionAt] = useState<string | null>(null)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', phone: '', subject: '', message: '' },
  })

  const sendMut = useMutation({
    mutationFn: submitContactMessage,
    onSuccess: () => {
      toast.success('Mensaje enviado. Nos pondremos en contacto a la brevedad.')
      setLastSubmissionAt(new Date().toISOString())
      form.reset()
    },
    onError: () => toast.error('No se pudo enviar. Intente nuevamente.'),
  })

  useEffect(() => {
    if (!lastSubmissionAt) return
    console.log('Formulario enviado:', lastSubmissionAt)
  }, [lastSubmissionAt])

  return (
    <section id="contacto" className="scroll-mt-20 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Escríbanos</h2>
            <p className="mt-2 text-muted-foreground">
              Complete el formulario y recibiremos su mensaje en el panel de administración. Por ahora, los datos se
              conservan en su navegador mediante almacenamiento local.
            </p>
            <Separator className="my-8" />
            <p className="text-sm text-muted-foreground">
              Horarios de referencia: <span className="font-medium text-foreground">{clinic.openingHours}</span>
            </p>
            {lastSubmissionAt ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Ultimo envio registrado: {new Date(lastSubmissionAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Formulario de contacto</CardTitle>
              <CardDescription>Le responderemos a la dirección de correo indicada.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={form.handleSubmit((v) => sendMut.mutate(v))} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Nombre y apellido" htmlFor="c-name" required error={form.formState.errors.name?.message}>
                    <Input id="c-name" autoComplete="name" {...form.register('name')} />
                  </FormField>
                  <FormField label="Correo electrónico" htmlFor="c-email" required error={form.formState.errors.email?.message}>
                    <Input id="c-email" type="email" autoComplete="email" {...form.register('email')} />
                  </FormField>
                </div>
                <FormField label="Teléfono (opcional)" htmlFor="c-phone" error={form.formState.errors.phone?.message}>
                  <Input id="c-phone" type="tel" autoComplete="tel" {...form.register('phone')} />
                </FormField>
                <FormField label="Asunto" htmlFor="c-subject" required error={form.formState.errors.subject?.message}>
                  <Input id="c-subject" {...form.register('subject')} />
                </FormField>
                <FormField label="Mensaje" htmlFor="c-message" required error={form.formState.errors.message?.message}>
                  <Textarea id="c-message" rows={5} className="min-h-[120px] resize-y" {...form.register('message')} />
                </FormField>
                <Button type="submit" className="w-full sm:w-auto" disabled={sendMut.isPending}>
                  {sendMut.isPending ? 'Enviando…' : 'Enviar mensaje'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
