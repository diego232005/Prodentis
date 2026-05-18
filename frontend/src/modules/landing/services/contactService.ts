import { mockDelay } from '@/lib/api/delay'
import { createId } from '@/lib/utils/id'
import { useContactInboxStore } from '@/app/store/useContactInboxStore'
import type { ContactFormValues } from '@/modules/landing/schemas/contactSchema'
import type { ContactMessage } from '@/modules/landing/types'

/**
 * Simula envío al backend. Hoy persiste en localStorage vía Zustand.
 * Reemplazar por POST /api/contact manteniendo la misma firma.
 */
export async function submitContactMessage(input: ContactFormValues): Promise<ContactMessage> {
  await mockDelay(550)
  const msg: ContactMessage = {
    id: createId('contact'),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: (input.phone ?? '').trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
  }
  useContactInboxStore.getState().addMessage(msg)
  return msg
}
