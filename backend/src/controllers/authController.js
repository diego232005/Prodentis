import { query } from '../config/database.js'
import { mappers } from '../utils/mappers.js'
import { assertFound, httpError, wrap } from '../utils/http.js'

function publicUser(row) {
  const { password: _password, ...user } = mappers.user(row)
  return user
}

export const login = wrap(async (req, res) => {
  const { email, password } = req.body
  const { rows } = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email])
  const user = rows[0]
  if (!user || user.password !== password) throw httpError(401, 'Credenciales inválidas')
  const dentist = user.role === 'dentist' ? (await query('SELECT * FROM dentists WHERE user_id = $1', [user.id])).rows[0] : null
  res.json({ user: publicUser(user), dentist: dentist ? mappers.dentist(dentist) : null })
})

/** Devuelve el usuario indicado por el header x-user-id. */
export const me = wrap(async (req, res) => {
  if (!req.actor?.id) throw httpError(401, 'No autenticado')
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.actor.id])
  res.json({ user: publicUser(assertFound(rows[0], 'Usuario')) })
})
