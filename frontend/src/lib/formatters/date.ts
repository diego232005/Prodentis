import { format, formatISO, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(iso: string, pattern = 'dd/MM/yyyy'): string {
  return format(parseISO(iso), pattern, { locale: es })
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: es })
}

export function toIsoDate(d: Date): string {
  return formatISO(d, { representation: 'date' })
}
