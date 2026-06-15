import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AuthLayout } from "@/layouts/auth-layout"
import { DashboardLayout } from "@/layouts/dashboard-layout"

import LoginPage from "@/routes/pages/login"
import DashboardPage from "@/routes/pages/dashboard"
import EmployeesPage from "@/routes/pages/employees"
import CreateEmployeePage from "@/routes/pages/create-employee"
import EditEmployeePage from "@/routes/pages/edit-employee"
import ViewEmployeePage from "@/routes/pages/view-employee"
import AttendancePage from "@/routes/pages/attendance"
import AttendanceSetupPage from "@/routes/pages/attendance-setup"
import LeavePage from "@/routes/pages/leave"
import PayrollPage from "@/routes/pages/payroll"
import DepartmentsPage from "@/routes/pages/departments"
import CreateDepartmentPage from "@/routes/pages/create-department"
import EditDepartmentPage from "@/routes/pages/edit-department"
import ViewDepartmentPage from "@/routes/pages/view-department"
import CreateDesignationPage from "@/routes/pages/create-designation"
import EditDesignationPage from "@/routes/pages/edit-designation"
import ViewDesignationPage from "@/routes/pages/view-designation"
import DocumentsPage from "@/routes/pages/documents"
import ReportsPage from "@/routes/pages/reports"
import SettingsPage from "@/routes/pages/settings"
import RecruitmentPage from "@/routes/pages/recruitment"
import AnnouncementsPage from "@/routes/pages/announcements"
import SeparationPage from "@/routes/pages/separation"
import DisciplinaryPage from "@/routes/pages/disciplinary"
import PerformancePage from "@/routes/pages/performance"
import MedicalReimbursementPage from "@/routes/pages/medical-reimbursement"
import TADAClaimPage from "@/routes/pages/tada-claim"
import BusinessTravelAdvancePage from "@/routes/pages/business-travel-advance"
import LettersPage from "@/routes/pages/letters"
import ViewLetterPage from "@/routes/pages/view-letter"
import PrintJoiningLetterPage from "@/routes/pages/print/joining-letter"
import PrintOfferLetterPage from "@/routes/pages/print/offer-letter"
import PrintHRLetterPage from "@/routes/pages/print/hr-letter"
import ProfilePage from "@/routes/pages/profile"

import { ProtectedRoute } from "@/components/auth/protected-route"

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground/20">404</h1>
      <h2 className="mt-4 text-xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Go to Dashboard
      </a>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="hr-theme">
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Public auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected dashboard routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="employees/create" element={<CreateEmployeePage />} />
                <Route path="employees/edit/:email" element={<EditEmployeePage />} />
                <Route path="employees/view/:email" element={<ViewEmployeePage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="attendance/setup" element={<AttendanceSetupPage />} />
                <Route path="leave" element={<LeavePage />} />
                <Route path="payroll" element={<PayrollPage />} />
                <Route path="claims" element={<Navigate to="/claims/medical" replace />} />
                <Route path="claims/medical" element={<MedicalReimbursementPage />} />
                <Route path="claims/tada" element={<TADAClaimPage />} />
                <Route path="claims/advance" element={<BusinessTravelAdvancePage />} />
                <Route path="letters" element={<LettersPage />} />
                <Route path="letters/view/:id" element={<ViewLetterPage />} />
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="departments/create" element={<CreateDepartmentPage />} />
                <Route path="departments/edit/:id" element={<EditDepartmentPage />} />
                <Route path="departments/view/:id" element={<ViewDepartmentPage />} />
                <Route path="designations/create" element={<CreateDesignationPage />} />
                <Route path="designations/edit/:id" element={<EditDesignationPage />} />
                <Route path="designations/view/:id" element={<ViewDesignationPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="recruitment" element={<RecruitmentPage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="separation" element={<SeparationPage />} />
                <Route path="disciplinary" element={<DisciplinaryPage />} />
                <Route path="performance" element={<PerformancePage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>

            {/* Printable templates */}
            <Route path="/recruitment/print/:candidateId" element={<PrintJoiningLetterPage />} />
            <Route path="/recruitment/print-offer/:candidateId" element={<PrintOfferLetterPage />} />
            <Route path="/letters/print/:id" element={<PrintHRLetterPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App

