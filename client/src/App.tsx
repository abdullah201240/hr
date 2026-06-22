import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AuthLayout } from "@/layouts/auth-layout"
import { DashboardLayout } from "@/layouts/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PermissionGuard } from "@/components/auth/role-guard"
import { ErrorBoundary } from "@/components/error-boundary"


import LoginPage from "@/routes/pages/login"

// Lazy loaded page components
const DashboardPage = lazy(() => import("@/routes/pages/dashboard"))
const EmployeesPage = lazy(() => import("@/routes/pages/employees"))
const CreateEmployeePage = lazy(() => import("@/routes/pages/create-employee"))
const EditEmployeePage = lazy(() => import("@/routes/pages/edit-employee"))
const ViewEmployeePage = lazy(() => import("@/routes/pages/view-employee"))
const AttendancePage = lazy(() => import("@/routes/pages/attendance"))
const CompanyAttendancePage = lazy(() => import("@/routes/pages/company-attendance"))
const LeavePage = lazy(() => import("@/routes/pages/leave"))
const PayrollPage = lazy(() => import("@/routes/pages/payroll"))
const DepartmentsPage = lazy(() => import("@/routes/pages/departments"))
const CreateDepartmentPage = lazy(() => import("@/routes/pages/create-department"))
const EditDepartmentPage = lazy(() => import("@/routes/pages/edit-department"))
const ViewDepartmentPage = lazy(() => import("@/routes/pages/view-department"))
const CreateDesignationPage = lazy(() => import("@/routes/pages/create-designation"))
const EditDesignationPage = lazy(() => import("@/routes/pages/edit-designation"))
const ViewDesignationPage = lazy(() => import("@/routes/pages/view-designation"))
const DocumentsPage = lazy(() => import("@/routes/pages/documents"))
const ReportsPage = lazy(() => import("@/routes/pages/reports"))
const SettingsPage = lazy(() => import("@/routes/pages/settings"))
const RecruitmentPage = lazy(() => import("@/routes/pages/recruitment"))
const AnnouncementsPage = lazy(() => import("@/routes/pages/announcements"))
const SeparationPage = lazy(() => import("@/routes/pages/separation"))
const DisciplinaryPage = lazy(() => import("@/routes/pages/disciplinary"))
const PerformancePage = lazy(() => import("@/routes/pages/performance"))
const MedicalReimbursementPage = lazy(() => import("@/routes/pages/medical-reimbursement"))
const TADAClaimPage = lazy(() => import("@/routes/pages/tada-claim"))
const BusinessTravelAdvancePage = lazy(() => import("@/routes/pages/business-travel-advance"))
const LettersPage = lazy(() => import("@/routes/pages/letters"))
const ViewLetterPage = lazy(() => import("@/routes/pages/view-letter"))
const PrintJoiningLetterPage = lazy(() => import("@/routes/pages/print/joining-letter"))
const PrintOfferLetterPage = lazy(() => import("@/routes/pages/print/offer-letter"))
const PrintHRLetterPage = lazy(() => import("@/routes/pages/print/hr-letter"))
const PrintPayslipPage = lazy(() => import("@/routes/pages/print/payslip"))
const ProfilePage = lazy(() => import("@/routes/pages/profile"))
const TasksPage = lazy(() => import("@/routes/pages/tasks"))
const ChatPage = lazy(() => import("@/routes/pages/chat"))
const NotificationsPage = lazy(() => import("@/routes/pages/notifications"))
const LeaveApplicationsPage = lazy(() => import("@/routes/pages/leave-applications"))
const CeoDashboardPage = lazy(() => import("@/routes/pages/ceo-dashboard"))


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

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function App() {
  return (

    <ThemeProvider defaultTheme="system" storageKey="hr-theme">
      <TooltipProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              {/* Public auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* Protected dashboard routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  {/* ── All authenticated users ────────────────────────────── */}
                  <Route index element={<DashboardPage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="attendance/setup" element={<Navigate to="/settings?tab=attendance" replace />} />
                  <Route path="leave" element={<LeavePage />} />
                  <Route path="claims" element={<Navigate to="/claims/medical" replace />} />
                  <Route path="claims/medical" element={<MedicalReimbursementPage />} />
                  <Route path="claims/tada" element={<TADAClaimPage />} />
                  <Route path="claims/advance" element={<BusinessTravelAdvancePage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="announcements" element={<AnnouncementsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="leave-applications" element={<LeaveApplicationsPage />} />

                  {/* Departments & designations: read-only view for all */}
                  <Route path="departments" element={<DepartmentsPage />} />
                  <Route path="departments/view/:id" element={<ViewDepartmentPage />} />
                  <Route path="designations/view/:id" element={<ViewDesignationPage />} />
                  <Route path="documents" element={<DocumentsPage />} />

                  {/* Employee profile view: employees can view own profile (OwnerOnly guard on backend) */}
                  <Route path="employees/view/:id" element={<ViewEmployeePage />} />

                  {/* ── Executive Dashboard ───────────────────────────────── */}
                  <Route element={<PermissionGuard requires={["dashboard:view_executive"]} />}>
                    <Route path="ceo-dashboard" element={<CeoDashboardPage />} />
                  </Route>

                  {/* ── Manager+ routes ────────────────────────────────────── */}
                  <Route element={<PermissionGuard requires={["employees:view_all", "employees:view_team", "employees:read"]} />}>
                    <Route path="employees" element={<EmployeesPage />} />
                    <Route path="attendance/company" element={<CompanyAttendancePage />} />
                    <Route path="performance" element={<PerformancePage />} />
                    <Route path="reports" element={<ReportsPage />} />
                  </Route>

                  {/* ── Admin/HR-only routes ───────────────────────────────── */}
                  <Route element={<PermissionGuard requires={["employees:create", "employees:update", "employees:delete", "payroll:read", "payroll:process", "recruitment:read", "letters:read"]} />}>
                    <Route path="employees/create" element={<CreateEmployeePage />} />
                    <Route path="employees/edit/:id" element={<EditEmployeePage />} />
                    <Route path="payroll" element={<PayrollPage />} />
                    <Route path="recruitment" element={<RecruitmentPage />} />
                    <Route path="separation" element={<SeparationPage />} />
                    <Route path="disciplinary" element={<DisciplinaryPage />} />
                    <Route path="letters" element={<LettersPage />} />
                    <Route path="letters/view/:id" element={<ViewLetterPage />} />
                    <Route path="departments/create" element={<CreateDepartmentPage />} />
                    <Route path="departments/edit/:id" element={<EditDepartmentPage />} />
                    <Route path="designations/create" element={<CreateDesignationPage />} />
                    <Route path="designations/edit/:id" element={<EditDesignationPage />} />
                  </Route>

                  {/* ── Admin-only routes ──────────────────────────────────── */}
                  <Route element={<PermissionGuard requires={["settings:read", "settings:update"]} />}>
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />

                </Route>
              </Route>

              {/* Printable templates (protected, permission-based) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<PermissionGuard requires={["recruitment:read", "letters:read"]} />}>
                  <Route path="/recruitment/print/:candidateId" element={<Suspense fallback={<LoadingSpinner />}><PrintJoiningLetterPage /></Suspense>} />
                  <Route path="/recruitment/print-offer/:candidateId" element={<Suspense fallback={<LoadingSpinner />}><PrintOfferLetterPage /></Suspense>} />
                  <Route path="/letters/print/:id" element={<Suspense fallback={<LoadingSpinner />}><PrintHRLetterPage /></Suspense>} />
                </Route>
                {/* Print payslip route is accessible to all logged-in users; authorization check is done inside the page */}
                <Route path="/payroll/print/:monthKey/:payslipId" element={<Suspense fallback={<LoadingSpinner />}><PrintPayslipPage /></Suspense>} />
              </Route>
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
