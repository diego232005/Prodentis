import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { loginRules } from '../validators/hisValidator.js'
import * as ctrl from '../controllers/authController.js'

const router = Router()

router.post('/login', loginRules, validate, ctrl.login)
router.get('/me', ctrl.me)

export default router