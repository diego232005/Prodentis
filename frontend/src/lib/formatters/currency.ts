export function formatCurrency(value: number, locale = 'es-AR', currency = 'ARS'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}
