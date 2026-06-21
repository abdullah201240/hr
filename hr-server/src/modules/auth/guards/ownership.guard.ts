import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OWNER_ONLY_KEY } from './owner.decorator';

/**
 * OwnershipGuard enforces resource-level access control.
 *
 * Defense-in-depth Layer 3 (after JwtAuthGuard + RolesGuard):
 * - If the endpoint is not decorated with @OwnerOnly() → passthrough (allow)
 * - Admin / HR → always bypass (full access to all resources)
 * - Manager → bypass (team-level access; endpoint-level service checks handle dept scoping)
 * - Employee → route param `:id` (or `:employeeId`) must match their own `user.id`
 *
 * Register as a global guard in AppModule (after RolesGuard).
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    // Admin and HR have full access to all resources
    if (user.role === 'admin' || user.role === 'hr') return true;

    // Manager has team-level access; fine-grained department scoping is handled in the service layer
    if (user.role === 'manager') return true;

    // Employee: strictly owner-only — the resource ID must match their own user ID
    const resourceId: string | undefined = req.params?.id ?? req.params?.employeeId;

    if (resourceId && resourceId !== user.id) {
      throw new ForbiddenException('You can only access your own data');
    }

    return true;
  }
}
