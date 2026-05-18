import { Router } from 'express'
import patients from './patients.js'
import appointments from './appointments.js'
import inventory from './inventory.js'
import { getBootstrap } from '../controllers/bootstrapController.js'

const router = Router()

router.get('/health', (_req, res) => res.json({ ok: true, service: 'prodentis-api' }))
router.get('/bootstrap', getBootstrap)
router.use('/patients', patients)
router.use('/appointments', appointments)
router.use('/inventory', inventory)

export default router
