import { z } from 'zod'

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Ingrese al menos 2 caracteres'),
  email: z.string().min(1, 'Correo requerido').email('Correo inválido'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Asunto demasiado corto'),
  message: z.string().min(20, 'Describa su consulta (mín. 20 caracteres)'),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>
