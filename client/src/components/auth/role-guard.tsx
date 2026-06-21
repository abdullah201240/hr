import { Navigate, Outlet } from "react-router"
import { useAuthStore } from "@/store/useAuthStore"

interface PermissionGuardProps {
  /** List of permissions — user needs at least ONE to access the wrapped routes */
  requires: string[]
  /** Where to redirect unauthorized users. Defaults to "/" (dashboard) */
  fallbackPath?: string
}

/**
 * PermissionGuard — Frontend route-level access control.
 *
 * Wraps a group of <Route> elements and redirects users who lack ALL
 * required permissions to `fallbackPath`. This is a UX guard — the backend
 * enforces the real security via RolesGuard + OwnershipGuard.
 *
 * Usage in App.tsx:
 *   <Route element={<PermissionGuard requires={["employees:create", "employees:update"]} />}>
 *     <Route path="employees/create" element={<CreateEmployeePage />} />
 *   </Route>
 */
export function PermissionGuard({
  requires,
  fallbackPath = "/",
}: PermissionGuardProps) {
  const { user, isAuthenticated } = useAuthStore()

  // Not yet authenticated — ProtectedRoute handles the /login redirect
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const userPermissions = user.permissions || []

  // If no permissions required, allow access
  if (!requires || requires.length === 0) {
    return <Outlet />
  }

  // Check if user has at least ONE of the required permissions
  const hasAccess = requires.some((perm) => userPermissions.includes(perm))

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />
  }

  return <Outlet />
}
