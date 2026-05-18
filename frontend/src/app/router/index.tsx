import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { MainLayout } from '@/app/layouts/MainLayout'
import { GuestRoute } from '@/app/router/GuestRoute'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { RoleGuard } from '@/app/router/RoleGuard'
import { ForgotPasswordPage } from '@/modules/auth/pages/ForgotPasswordPage'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { ProfilePage } from '@/modules/auth/pages/ProfilePage'
import { AppointmentDetailPage } from '@/modules/appointments/pages/AppointmentDetailPage'
import { AppointmentFormPage } from '@/modules/appointments/pages/AppointmentFormPage'
import { AppointmentsCalendarPage } from '@/modules/appointments/pages/AppointmentsCalendarPage'
import { AppointmentsListPage } from '@/modules/appointments/pages/AppointmentsListPage'
import { BillingListPage } from '@/modules/billing/pages/BillingListPage'
import { BillingNewPage } from '@/modules/billing/pages/BillingNewPage'
import { InvoiceDetailPage } from '@/modules/billing/pages/InvoiceDetailPage'
import { ClinicalRecordPatientPage } from '@/modules/clinical-records/pages/ClinicalRecordPatientPage'
import { ClinicalRecordsIndexPage } from '@/modules/clinical-records/pages/ClinicalRecordsIndexPage'
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage'
import { NotFoundPage } from '@/modules/dashboard/pages/NotFoundPage'
import { InventoryDetailPage } from '@/modules/inventory/pages/InventoryDetailPage'
import { InventoryListPage } from '@/modules/inventory/pages/InventoryListPage'
import { InventoryNewPage } from '@/modules/inventory/pages/InventoryNewPage'
import { PatientDetailPage } from '@/modules/patients/pages/PatientDetailPage'
import { PatientFormPage } from '@/modules/patients/pages/PatientFormPage'
import { PatientsListPage } from '@/modules/patients/pages/PatientsListPage'
import { ReportsPage } from '@/modules/reports/pages/ReportsPage'
import { SettingsPage } from '@/modules/settings/pages/SettingsPage'
import { TreatmentDetailPage } from '@/modules/treatments/pages/TreatmentDetailPage'
import { TreatmentsListPage } from '@/modules/treatments/pages/TreatmentsListPage'
import { PublicPage } from '@/app/router/PublicPage'

/**
 * Árbol de rutas con API declarativa (entregable: Routes, Route, Link en Navbar/Footer).
 * BrowserRouter envuelve esto en `App.tsx`.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicPage />} />

      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleGuard />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsListPage />} />
            <Route path="/patients/new" element={<PatientFormPage mode="new" />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/patients/:id/edit" element={<PatientFormPage mode="edit" />} />
            <Route path="/appointments" element={<AppointmentsListPage />} />
            <Route path="/appointments/calendar" element={<AppointmentsCalendarPage />} />
            <Route path="/appointments/new" element={<AppointmentFormPage />} />
            <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
            <Route path="/clinical-records" element={<ClinicalRecordsIndexPage />} />
            <Route path="/clinical-records/:patientId" element={<ClinicalRecordPatientPage />} />
            <Route path="/treatments" element={<TreatmentsListPage />} />
            <Route path="/treatments/:id" element={<TreatmentDetailPage />} />
            <Route path="/billing" element={<BillingListPage />} />
            <Route path="/billing/new" element={<BillingNewPage />} />
            <Route path="/billing/:id" element={<InvoiceDetailPage />} />
            <Route path="/inventory" element={<InventoryListPage />} />
            <Route path="/inventory/new" element={<InventoryNewPage />} />
            <Route path="/inventory/:id" element={<InventoryDetailPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/not-found" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
