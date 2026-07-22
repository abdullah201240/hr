import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Restrict a route to users who hold specific permissions via their custom role.
 * Usage: @Permissions('employees:create', 'employees:update')
 *
 * Permissions are expressed as "resource:action" strings and checked against
 * the employee's assigned custom role in the PermissionsGuard.
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
