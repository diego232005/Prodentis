import { httpError } from '../utils/http.js'

const ROLES = ['admin', 'receptionist', 'dentist', 'assistant']

/** Lee x-user-id / x-user-role (opcionales) y los expone en req.actor. */
export function attachActor(req, _res, next) {
  const role = String(req.get('x-user-role') || '').toLowerCase()
  req.actor = {
    id: req.get('x-user-id') || null,
    role: ROLES.includes(role) ? role : null,
  }
  next()
}

/** Permite si no hay rol informado; si hay, exige que esté en la lista (admin siempre pasa). */
export function requireRoles(...allowed) {
  return (req, _res, next) => {
    const role = req.actor?.role
    if (!role) return next()
    if (role === 'admin' || allowed.includes(role)) return next()
    return next(httpError(403, 'No tenés permisos para realizar esta acción'))
  }
}

export const clinicalWrite = requireRoles('dentist')
export const receptionWrite = requireRoles('receptionist')
export const appointmentUpdate = requireRoles('receptionist', 'dentist')
export const inventoryWrite = requireRoles('assistant', 'dentist', 'receptionist')
