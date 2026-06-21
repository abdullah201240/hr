import { useAuthStore } from "@/store/useAuthStore"

/**
 * usePermissions — Hook to check user permissions for UI access control.
 * 
 * All access is controlled by permissions only (no role-based bypass).
 * Users must have the required permissions in their assigned custom role or base role.
 * 
 * Usage:
 *   const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
 *   
 *   // Check single permission
 *   if (hasPermission('employees:read')) { ... }
 *   
 *   // Check any permission (OR logic)
 *   if (hasAnyPermission(['employees:read', 'employees:view_team'])) { ... }
 *   
 *   // Check all permissions (AND logic)
 *   if (hasAllPermissions(['employees:create', 'employees:update'])) { ... }
 */
export function usePermissions() {
  const { user } = useAuthStore()

  // Get user's permissions (from custom role or base role)
  const userPermissions = user?.permissions || []

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission)
  }

  /**
   * Check if user has ANY of the specified permissions (OR logic)
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true
    return permissions.some(perm => userPermissions.includes(perm))
  }

  /**
   * Check if user has ALL of the specified permissions (AND logic)
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true
    return permissions.every(perm => userPermissions.includes(perm))
  }

  /**
   * Check if user can access a navigation item based on permissions
   * (roles are still checked for backward compatibility, but permissions take precedence)
   */
  const canAccessNavItem = (item: { roles?: string[]; permissions?: string[] }): boolean => {
    // If no restrictions, allow access
    if (!item.roles && !item.permissions) return true

    // Check permission restriction (if defined, this takes precedence)
    if (item.permissions && item.permissions.length > 0) {
      // For permissions, user needs at least ONE of the required permissions
      if (!hasAnyPermission(item.permissions)) return false
    }

    // Check role restriction (only if no permissions defined)
    if (!item.permissions && item.roles) {
      if (!user?.role) return false
      if (!item.roles.includes(user.role as any)) return false
    }

    return true
  }

  return {
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessNavItem,
  }
}
