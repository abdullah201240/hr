import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../../common/enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to specific roles.
 * Accepts Role enum values or plain strings for backward compatibility.
 * Usage: @Roles(Role.ADMIN, Role.HR) or @Roles('admin', 'hr')
 */
export const Roles = (...roles: (Role | string)[]) => SetMetadata(ROLES_KEY, roles);
