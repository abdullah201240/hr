import { useAuthStore } from "@/store/useAuthStore"

interface AuthorizedProps {
  /**
   * If provided, user must have at least ONE of these permissions to render children.
   * Omit to skip permission check.
   */
  permissions?: string[]

  /**
   * If true, also enforces that the current user owns the resource.
   * Only relevant when the user lacks elevated permissions (e.g., employees:view_all).
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
 * Conditionally renders children based on the current user's permissions and/or
 * resource ownership. This is a UX component — the real security is enforced
 * by the backend RolesGuard + OwnershipGuard.
 *
 * Usage examples:
 *
 * // Only users with employees:create see the "Add Employee" button
 * <Authorized permissions={["employees:create"]}>
 *   <Button>Add Employee</Button>
 * </Authorized>
 *
 * // Users with employees:update OR the resource owner can edit
 * <Authorized permissions={["employees:update"]} ownOnly resourceOwnerId={claim.employeeId}>
 *   <Button variant="destructive">Delete</Button>
 * </Authorized>
 *
 * // With fallback for non-authorized users
 * <Authorized permissions={["settings:update"]} fallback={<Badge>Read Only</Badge>}>
 *   <EditButton />
 * </Authorized>
 */
export function Authorized({
  permissions,
  ownOnly,
  resourceOwnerId,
  children,
  fallback = null,
}: AuthorizedProps) {
  const { user } = useAuthStore()

  if (!user) return <>{fallback}</>

  const userPermissions = user.permissions || []

  // Permission check — if permissions prop is provided, user needs at least one
  if (permissions && permissions.length > 0) {
    const hasAny = permissions.some((perm) => userPermissions.includes(perm))
    if (!hasAny) {
      return <>{fallback}</>
    }
  }

  // Ownership check — only enforced if ownOnly is true
  // Users with elevated permissions (view_all, update) bypass ownership check
  if (ownOnly && resourceOwnerId !== user.id) {
    const hasBypass = userPermissions.some((p) =>
      p.includes("view_all") || p.includes("update")
    )
    if (!hasBypass) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}
