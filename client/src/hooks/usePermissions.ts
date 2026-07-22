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

  // Get user's permissions from their assigned custom role
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
   * Check if user can access a navigation item based on permissions only
   */
  const canAccessNavItem = (item: { permissions?: string[] }): boolean => {
    // If no permission restrictions, allow access
    if (!item.permissions || item.permissions.length === 0) return true

    // User needs at least ONE of the required permissions
    return hasAnyPermission(item.permissions)
  }

  return {
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessNavItem,
  }
}
