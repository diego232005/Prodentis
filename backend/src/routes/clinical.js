import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { clinicalWrite } from '../middleware/rbac.js'
import * as v from '../validators/hisValidator.js'
import * as ctrl from '../controllers/clinicalController.js'

const router = Router()

router.get('/entries', v.patientQueryRules, validate, ctrl.listEntries)
router.post('/entries', clinicalWrite, v.createEntryRules, validate, ctrl.createEntry)
router.put('/entries/:id', clinicalWrite, v.updateEntryRules, validate, ctrl.updateEntry)
router.delete('/entries/:id', clinicalWrite, v.idRules, validate, ctrl.deleteEntry)

router.get('/odontograms/:patientId', v.patientIdRules, validate, ctrl.getOdontogram)
router.put('/odontograms/:patientId', clinicalWrite, v.saveOdontogramRules, validate, ctrl.saveOdontogram)
router.get('/odontograms/:patientId/snapshots', v.patientIdRules, validate, ctrl.listSnapshots)
router.post('/odontograms/:patientId/snapshots', clinicalWrite, v.snapshotRules, validate, ctrl.createSnapshot)

router.get('/periodontograms', v.patientQueryRules, validate, ctrl.listPeriodontograms)
router.post('/periodontograms', clinicalWrite, v.periodontogramRules, validate, ctrl.createPeriodontogram)
router.delete('/periodontograms/:id', clinicalWrite, v.idRules, validate, ctrl.deletePeriodontogram)

router.get('/medications', ctrl.listMedications)
router.post('/medications', clinicalWrite, v.createMedicationRules, validate, ctrl.createMedication)
router.put('/medications/:id', clinicalWrite, v.updateMedicationRules, validate, ctrl.updateMedication)

router.get('/prescriptions', v.patientQueryRules, validate, ctrl.listPrescriptions)
router.post('/prescriptions', clinicalWrite, v.prescriptionRules, validate, ctrl.createPrescription)
router.delete('/prescriptions/:id', clinicalWrite, v.idRules, validate, ctrl.deletePrescription)

router.get('/diagnostics', v.patientQueryRules, validate, ctrl.listDiagnostics)
router.get('/diagnostics/:id', v.idRules, validate, ctrl.getDiagnosticFile)
router.post('/diagnostics', clinicalWrite, v.diagnosticRules, validate, ctrl.createDiagnostic)
router.delete('/diagnostics/:id', clinicalWrite, v.idRules, validate, ctrl.deleteDiagnostic)

export default router