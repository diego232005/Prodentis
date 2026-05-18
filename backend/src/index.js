import dotenv from 'dotenv'
import { createApp } from './app.js'
import { ensureDatabase } from './db/init.js'

dotenv.config()

const port = Number(process.env.PORT) || 3001

async function start() {
  const seeded = await ensureDatabase()
  if (seeded) console.log('✓ Datos de demostración cargados en PostgreSQL')
  const app = createApp()
  app.listen(port, () => {
    console.log(`✓ API PRODENTIS en http://localhost:${port}/api`)
  })
}

start().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err.message || err)
  if (err.code === 'ECONNREFUSED' || err.code === '3D000') {
    console.error('→ Creá la base "prodentis" en PostgreSQL y revisá DATABASE_URL en backend/.env')
  }
  process.exit(1)
})
