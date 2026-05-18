import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Ingrese su correo').email('Correo inválido'),
  password: z.string().min(1, 'Ingrese su contraseña'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Ingrese su correo').email('Correo inválido'),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
