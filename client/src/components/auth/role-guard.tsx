import { Navigate, Outlet } from "react-router"
import { useAuthStore } from "@/store/useAuthStore"

interface RoleGuardProps {
  /** List of roles that are allowed to access the wrapped routes */
  allowedRoles: Array<"admin" | "hr" | "manager" | "employee">
  /** Where to redirect unauthorized users. Defaults to "/" (dashboard) */
  fallbackPath?: string
}

/**
 * RoleGuard — Frontend route-level access control (Gap G4 fix).
 *
 * Wraps a group of <Route> elements and redirects users whose role is not
 * in `allowedRoles` to `fallbackPath`. This is a UX guard — the backend
 * enforces the real security via RolesGuard + OwnershipGuard.
 *
 * Usage in App.tsx:
 *   <Route element={<RoleGuard allowedRoles={["admin", "hr"]} />}>
 *     <Route path="payroll" element={<PayrollPage />} />
 *   </Route>
 */
export function RoleGuard({
  allowedRoles,
  fallbackPath = "/",
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuthStore()

  // Not yet authenticated — ProtectedRoute handles the /login redirect
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Role not allowed — redirect to dashboard (or custom fallback)
  if (!allowedRoles.includes(user.role as any)) {
    return <Navigate to={fallbackPath} replace />
  }

  return <Outlet />
}
