import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingState } from '@/components/feedback/LoadingState'
import { patientSchema, type PatientFormValues } from '@/modules/patients/schemas/patientSchema'
import { createPatient, getPatient, updatePatient } from '@/modules/patients/services/patientsService'
import { ROUTES } from '@/lib/constants/routes'

export function PatientFormPage({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const patientQ = useQuery({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id!),
    enabled: mode === 'edit' && Boolean(id),
  })

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      documentId: '',
      birthDate: '',
      phone: '',
      email: '',
      address: '',
      status: 'active',
      allergies: '',
      medicalNotes: '',
    },
  })

  useEffect(() => {
    if (patientQ.data) {
      const p = patientQ.data
      form.reset({
        firstName: p.firstName,
        lastName: p.lastName,
        documentId: p.documentId,
        birthDate: p.birthDate,
        phone: p.phone,
        email: p.email,
        address: p.address,
        status: p.status,
        allergies: p.allergies,
        medicalNotes: p.medicalNotes,
      })
    }
  }, [patientQ.data, form])

  const createMut = useMutation({
    mutationFn: createPatient,
    onSuccess: (p) => {
      toast.success('Paciente creado')
      qc.invalidateQueries({ queryKey: ['patients'] })
      navigate(ROUTES.patient(p.id))
    },
  })

  const updateMut = useMutation({
    mutationFn: updatePatient,
    onSuccess: (p) => {
      toast.success('Paciente actualizado')
      qc.invalidateQueries({ queryKey: ['patients'] })
      qc.invalidateQueries({ queryKey: ['patient', p.id] })
      navigate(ROUTES.patient(p.id))
    },
  })

  function onSubmit(values: PatientFormValues) {
    if (mode === 'new') {
      createMut.mutate(values)
    } else if (patientQ.data) {
      updateMut.mutate({
        ...patientQ.data,
        ...values,
      })
    }
  }

  if (mode === 'edit' && patientQ.isLoading) return <LoadingState />
  if (mode === 'edit' && patientQ.isError) {
    return (
      <PageContainer>
        <PageTitle title="Paciente no encontrado" />
        <Button variant="outline" onClick={() => navigate(ROUTES.patients)}>
          Volver al listado
        </Button>
      </PageContainer>
    )
  }

  const busy = createMut.isPending || updateMut.isPending

  return (
    <PageContainer>
      <PageTitle title={mode === 'new' ? 'Nuevo paciente' : 'Editar paciente'} description="Datos demográficos y antecedentes básicos" />
      <form className="mx-auto max-w-2xl space-y-6 rounded-lg border bg-card p-6 shadow-sm" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre" htmlFor="firstName" error={form.formState.errors.firstName?.message} required>
            <Input id="firstName" {...form.register('firstName')} />
          </FormField>
          <FormField label="Apellido" htmlFor="lastName" error={form.formState.errors.lastName?.message} required>
            <Input id="lastName" {...form.register('lastName')} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Documento" htmlFor="documentId" error={form.formState.errors.documentId?.message} required>
            <Input id="documentId" {...form.register('documentId')} />
          </FormField>
          <FormField label="Fecha de nacimiento" htmlFor="birthDate" error={form.formState.errors.birthDate?.message} required>
            <Input id="birthDate" type="date" {...form.register('birthDate')} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Teléfono" htmlFor="phone" error={form.formState.errors.phone?.message} required>
            <Input id="phone" {...form.register('phone')} />
          </FormField>
          <FormField label="Correo" htmlFor="email" error={form.formState.errors.email?.message} required>
            <Input id="email" type="email" {...form.register('email')} />
          </FormField>
        </div>
        <FormField label="Dirección" htmlFor="address" error={form.formState.errors.address?.message} required>
          <Input id="address" {...form.register('address')} />
        </FormField>
        <FormField label="Estado" htmlFor="status" error={form.formState.errors.status?.message} required>
          <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v as PatientFormValues['status'])}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
              <SelectItem value="archived">Archivado</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Alergias" htmlFor="allergies" error={form.formState.errors.allergies?.message}>
          <Textarea id="allergies" rows={2} {...form.register('allergies')} />
        </FormField>
        <FormField label="Notas médicas" htmlFor="medicalNotes" error={form.formState.errors.medicalNotes?.message}>
          <Textarea id="medicalNotes" rows={3} {...form.register('medicalNotes')} />
        </FormField>
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
