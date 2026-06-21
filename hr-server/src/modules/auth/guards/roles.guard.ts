import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';
import { RolesService } from '../../roles/roles.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Access denied: authentication required');
    }

    // Users must have a custom role assigned
    if (!user.customRoleId) {
      throw new ForbiddenException('Access denied: no role assigned');
    }

    // Fetch user's full permission set from their custom role
    const userPermissions = await this.rolesService.getUserPermissions(user.customRoleId);
    
    // Attach permissions to user object on request for downstream usage
    user.permissions = userPermissions;

    // ─── Explicit @Permissions() decorator ──────────────────────────────────
    if (requiredPermissions && requiredPermissions.length > 0) {
      // User must hold at least ONE of the required permissions
      const hasAny = requiredPermissions.some(p => userPermissions.has(p));
      if (hasAny) return true;

      // Special check: If leave:approve is required and user is the Line Manager of the applicant, allow.
      if (requiredPermissions.includes('leave:approve')) {
        const reqId = req.params.id;
        if (reqId) {
          const isLineManager = await this.rolesService.isLineManagerForLeave(user.id, reqId);
          if (isLineManager) return true;
        }
      }

      // Special check: If claims:approve is required and user is the Line Manager of the applicant, allow.
      if (requiredPermissions.includes('claims:approve')) {
        const reqId = req.params.id;
        if (reqId) {
          const isLineManager = await this.rolesService.isLineManagerForClaim(user.id, reqId);
          if (isLineManager) return true;
        }
      }

      throw new ForbiddenException(
        `Access denied: lacks required permission [${requiredPermissions.join(', ')}]`,
      );
    }

    // ─── Auto-mapped permission check (no decorator) ─────────────────────────
    const { resource, action } = this.mapRequestToPermission(req.method, req.url);

    // Bypass checks for self-service endpoints (auth, notifications) when no decorator is present
    if (resource === 'auth' || resource === 'notifications') {
      return true;
    }

    // Check direct permission
    if (userPermissions.has(`${resource}:${action}`)) {
      return true;
    }

    // For read requests, also allow view_all, view_team or view_own
    if (action === 'read') {
      const hasReadPermission =
        userPermissions.has(`${resource}:view_all`) ||
        userPermissions.has(`${resource}:view_team`) ||
        userPermissions.has(`${resource}:view_own`);
      if (hasReadPermission) return true;
    }

    throw new ForbiddenException(
      `Access denied: custom role lacks permission for ${resource}:${action}`,
    );
  }

  private mapRequestToPermission(method: string, path: string): { resource: string; action: string } {
    const pathWithoutQuery = path.split('?')[0];
    const cleanPath = pathWithoutQuery.replace(/^\/api\//, '/').replace(/\/+$/, '');
    const segments = cleanPath.split('/').filter(Boolean);
    let rawResource = segments[0] || 'unknown';
    let lastSegment = segments[segments.length - 1] || '';

    // Also check second-to-last segment for UUID-ending paths like /correction/approve/:id
    const secondToLast = segments.length >= 3 ? segments[segments.length - 2] : '';

    let resource = rawResource.replace(/-/g, '_');
    if (resource === 'leave_applications') resource = 'leave';
    if (resource === 'employee') resource = 'employees';
    if (resource === 'leave_types') resource = 'leave';
    if (resource === 'salary_templates' || resource === 'employee_salaries') resource = 'salary';
    if (resource === 'festival_bonus_rules') resource = 'payroll';
    if (resource === 'attendance_settings') resource = 'attendance';
    if (resource === 'provident_fund_settings') resource = 'salary';

    let action = 'read';
    if (method === 'POST') {
      action = 'create';
      if (resource === 'leave') action = 'apply';
      if (resource === 'claims') action = 'create';
      // Check for special action names in URL
      if (lastSegment === 'process') action = 'process';
      if (lastSegment === 'disburse') action = 'disburse';
      if (lastSegment === 'sync') action = 'update';
      if (lastSegment === 'approve' || lastSegment === 'status') action = 'approve';
      if (lastSegment === 'reject') action = 'reject';
      if (lastSegment === 'settle') action = 'settle';
      if (lastSegment === 'cancel') action = 'cancel';
      // Check second-to-last for UUID-ending paths
      if (secondToLast === 'approve') action = 'approve';
      if (secondToLast === 'reject') action = 'reject';
      if (secondToLast === 'status') action = 'approve';
    } else if (method === 'DELETE') {
      action = 'delete';
    } else if (method === 'PATCH' || method === 'PUT') {
      action = 'update';
      if (lastSegment === 'approve' || lastSegment === 'status') {
        action = 'approve';
      } else if (lastSegment === 'reject') {
        action = 'reject';
      } else if (lastSegment === 'settle') {
        action = 'settle';
      } else if (lastSegment === 'disburse') {
        action = 'disburse';
      } else if (lastSegment === 'process') {
        action = 'process';
      }
    }

    return { resource, action };
  }
}
