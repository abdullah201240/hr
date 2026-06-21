import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OWNER_ONLY_KEY } from './owner.decorator';
import { RolesService } from '../../roles/roles.service';

/**
 * OwnershipGuard enforces resource-level access control.
 *
 * Defense-in-depth Layer 3 (after JwtAuthGuard + RolesGuard):
 * - If the endpoint is not decorated with @OwnerOnly() → passthrough (allow)
 * - Users with employees:view_all or employees:view_team → bypass (broad access)
 * - Others → route param `:id` (or `:employeeId`) must match their own `user.id`
 *
 * Register as a global guard in AppModule (after RolesGuard).
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOwnerOnly = this.reflector.getAllAndOverride<boolean>(OWNER_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Guard is not applied to this endpoint — passthrough
    if (!isOwnerOnly) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Access denied: authentication required');
    }

    // Users with broad view permissions bypass ownership check
    if (user.customRoleId) {
      const perms = await this.rolesService.getUserPermissions(user.customRoleId);
      if (perms.has('employees:view_all') || perms.has('employees:view_team')) {
        return true;
      }
    }

    // Strictly owner-only — the resource ID must match their own user ID
    const resourceId: string | undefined = req.params?.id ?? req.params?.employeeId;

    if (resourceId && resourceId !== user.id) {
      throw new ForbiddenException('You can only access your own data');
    }

    return true;
  }
}
