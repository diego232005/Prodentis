import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '15mb' }))
  app.use('/api', routes)
  app.use(notFound)
  app.use(errorHandler)
  return app
}
