import { BrowserRouter, Routes, Route } from "react-router"
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
import TasksPage from "@/routes/pages/tasks"
import ProjectsPage from "@/routes/pages/projects"
import DocumentsPage from "@/routes/pages/documents"
import ReportsPage from "@/routes/pages/reports"
import SettingsPage from "@/routes/pages/settings"

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
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="departments/create" element={<CreateDepartmentPage />} />
              <Route path="departments/edit/:name" element={<EditDepartmentPage />} />
              <Route path="departments/view/:name" element={<ViewDepartmentPage />} />
              <Route path="designations/create" element={<CreateDesignationPage />} />
              <Route path="designations/edit/:name" element={<EditDesignationPage />} />
              <Route path="designations/view/:name" element={<ViewDesignationPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App

