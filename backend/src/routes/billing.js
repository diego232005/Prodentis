import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { receptionWrite } from '../middleware/rbac.js'
import * as v from '../validators/hisValidator.js'
import * as ctrl from '../controllers/billingController.js'

const router = Router()

router.get('/invoices', ctrl.listInvoices)
router.get('/invoices/:id', v.idRules, validate, ctrl.getInvoice)
router.post('/invoices', receptionWrite, v.createInvoiceRules, validate, ctrl.createInvoice)
router.post('/invoices/:id/void', receptionWrite, v.voidInvoiceRules, validate, ctrl.voidInvoice)
router.post('/invoices/:id/payments', receptionWrite, v.paymentRules, validate, ctrl.registerPayment)

router.get('/payments', v.paymentQueryRules, validate, ctrl.listPayments)

router.get('/cash-summary', v.dateQueryRules, validate, ctrl.cashSummary)
router.get('/cash-closures', ctrl.listCashClosures)
router.post('/cash-closures', receptionWrite, v.cashClosureRules, validate, ctrl.createCashClosure)

export default router