import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ContactMessage } from '@/modules/landing/types'

interface ContactInboxState {
  messages: ContactMessage[]
  addMessage: (m: ContactMessage) => void
  clearAll: () => void
}

export const useContactInboxStore = create<ContactInboxState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (m) => set((s) => ({ messages: [m, ...s.messages] })),
      clearAll: () => set({ messages: [] }),
    }),
    { name: 'prodentis-contact-inbox' },
  ),
)
