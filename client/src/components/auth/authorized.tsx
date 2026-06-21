import { useAuthStore } from "@/store/useAuthStore"

type AllowedRole = "admin" | "hr" | "manager" | "employee"

interface AuthorizedProps {
  /**
   * If provided, user's role must be in this list to render children.
   * Omit to skip role check.
   */
  roles?: AllowedRole[]

  /**
   * If true, also enforces that the current user owns the resource.
   * Only relevant when the user's role is 'employee'.
   * Admin/HR/Manager always bypass the ownership check.
   */
  ownOnly?: boolean

  /**
   * The ID of the resource owner to compare against the current user's ID.
   * Used with `ownOnly`. Should be the `employeeId` or `userId` of the resource.
   */
  resourceOwnerId?: string

  /** Content to render when access is granted */
  children: React.ReactNode

  /** Content to render when access is denied (default: null) */
  fallback?: React.ReactNode
}

/**
 * Authorized — Inline UI element visibility control (Defense-in-depth Layer 6).
 *
 * Conditionally renders children based on the current user's role and/or
 * resource ownership. This is a UX component — the real security is enforced
 * by the backend RolesGuard + OwnershipGuard.
 *
 * Usage examples:
 *
 * // Only admin/hr see the "Add Employee" button
 * <Authorized roles={["admin", "hr"]}>
 *   <Button>Add Employee</Button>
 * </Authorized>
 *
 * // Admin/HR or the resource owner can delete
 * <Authorized roles={["admin", "hr"]} ownOnly resourceOwnerId={claim.employeeId}>
 *   <Button variant="destructive">Delete</Button>
 * </Authorized>
 *
 * // With fallback for non-authorized users
 * <Authorized roles={["admin"]} fallback={<Badge>Read Only</Badge>}>
 *   <EditButton />
 * </Authorized>
 */
export function Authorized({
  roles,
  ownOnly,
  resourceOwnerId,
  children,
  fallback = null,
}: AuthorizedProps) {
  const { user } = useAuthStore()

  if (!user) return <>{fallback}</>

  // Role check — if roles prop is provided, user must be in the list
  if (roles && !roles.includes(user.role)) {
    return <>{fallback}</>
  }

  // Ownership check — only enforced for employee role
  // Admin / HR / Manager bypass this check
  if (ownOnly && user.role === "employee" && resourceOwnerId !== user.id) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
