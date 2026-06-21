import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { RolesService } from '../../roles/roles.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No roles decorator — allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.role) {
      throw new ForbiddenException('Access denied: no role assigned');
    }

    // ─── Custom Role Permissions check ───────────────────────────────────────
    if (user.customRoleId) {
      const { resource, action } = this.mapRequestToPermission(req.method, req.url);
      const userPermissions = await this.rolesService.getUserPermissions(user.role, user.customRoleId);

      // Check if user has explicit permission for the action on this resource
      const hasDirectPermission = userPermissions.has(`${resource}:${action}`);
      
      // For read requests, also allow if they have view_all, view_team or view_own
      const hasReadPermission = action === 'read' && (
        userPermissions.has(`${resource}:view_all`) ||
        userPermissions.has(`${resource}:view_team`) ||
        userPermissions.has(`${resource}:view_own`)
      );

      if (hasDirectPermission || hasReadPermission) {
        return true;
      }
      
      throw new ForbiddenException(
        `Access denied: custom role lacks permission for ${resource}:${action}`,
      );
    }

    // ─── Default System Roles check ──────────────────────────────────────────
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: requires one of [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }

  private mapRequestToPermission(method: string, path: string): { resource: string; action: string } {
    const cleanPath = path.replace(/^\/api\//, '/').replace(/\/+$/, '');
    const segments = cleanPath.split('/').filter(Boolean);
    let rawResource = segments[0] || 'unknown';
    let lastSegment = segments[segments.length - 1] || '';

    let resource = rawResource.replace(/-/g, '_');
    if (resource === 'leave_applications') resource = 'leave';
    if (resource === 'employee') resource = 'employees';

    let action = 'read';
    if (method === 'POST') {
      action = 'create';
      if (resource === 'leave') action = 'apply';
      if (resource === 'claims') action = 'create';
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
