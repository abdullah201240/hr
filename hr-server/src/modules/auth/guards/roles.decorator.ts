import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to specific roles.
 * Usage: @Roles('admin', 'hr')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
