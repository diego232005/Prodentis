import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool, types } = pg

// DATE (1082) como string 'YYYY-MM-DD' para evitar desfases de zona horaria
types.setTypeParser(1082, (v) => v)

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function query(text, params) {
  return pool.query(text, params)
}

export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  } finally {
    client.release()
  }
}
