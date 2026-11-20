export function httpError(status, message, details) {
  const err = new Error(message)
  err.status = status
  if (details) err.details = details
  return err
}

const PG_ERRORS = {
  '23503': [400, 'Referencia no válida (registro relacionado inexistente o en uso)'],
  '23505': [409, 'Registro duplicado'],
  '23514': [400, 'Valor fuera de los valores permitidos'],
  '22P02': [400, 'Formato de dato inválido'],
  '22007': [400, 'Fecha inválida'],
  '22008': [400, 'Fecha inválida'],
}

export function mapPgError(e) {
  if (!e.status && PG_ERRORS[e.code]) {
    e.status = PG_ERRORS[e.code][0]
    e.message = PG_ERRORS[e.code][1]
  }
  return e
}

export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((e) => next(mapPgError(e)))

export function assertFound(row, what) {
  if (!row) throw httpError(404, `${what} no encontrado`)
  return row
}
