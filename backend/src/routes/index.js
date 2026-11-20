import { Router } from 'express'
import patients from './patients.js'
import appointments from './appointments.js'
import inventory from './inventory.js'
import clinical from './clinical.js'
import billing from './billing.js'
import schedule from './schedule.js'
import consents from './consents.js'
import treatments from './treatments.js'
import auth from './auth.js'
import dashboard from './dashboard.js'
import { attachActor } from '../middleware/rbac.js'
import { getBootstrap } from '../controllers/bootstrapController.js'

const router = Router()

router.use(attachActor)
router.get('/health', (_req, res) => res.json({ ok: true, service: 'prodentis-api' }))
router.get('/bootstrap', getBootstrap)
router.use('/patients', patients)
router.use('/appointments', appointments)
router.use('/inventory', inventory)
router.use('/clinical', clinical)
router.use('/billing', billing)
router.use('/schedule', schedule)
router.use('/consents', consents)
router.use('/treatments', treatments)
router.use('/auth', auth)
router.use('/dashboard', dashboard)

export default router
