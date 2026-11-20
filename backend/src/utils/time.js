export const appTimezone = () => process.env.APP_TIMEZONE || 'America/Bogota'

/** Fecha local (YYYY-MM-DD) de hoy en la zona horaria dada (placeholder SQL). */
export const todayLocalDate = (tz) => `(NOW() AT TIME ZONE ${tz}::text)::date`

/** Fecha pedida o, si es NULL, hoy en zona local. */
export const dateOrToday = (tz, date) => `COALESCE(${date}::date, ${todayLocalDate(tz)})`

/** Instante de inicio del día local (timestamptz). */
export const localDayStart = (tz, dateExpr) => `(${dateExpr}::date::timestamp AT TIME ZONE ${tz}::text)`

export function parseDateParam(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}
