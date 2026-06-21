import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DB_CONNECTION, type Database } from '../../db';
import { auditLogs } from '../../db/schema';

/** HTTP methods that change state — these get audit-logged */
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * AuditLogInterceptor — Defense-in-depth Layer 6 (global interceptor).
 *
 * Records all state-changing operations (POST, PUT, PATCH, DELETE) to the
 * `audit_logs` table for compliance, forensics, and incident response.
 *
 * GET, HEAD, OPTIONS are deliberately excluded to keep the table lean.
 * Errors during audit-log writes are caught and only logged — they should
 * never block the main response.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: Database) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;

    // Only log state-changing operations
    if (!WRITE_METHODS.has(method)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: async () => {
          try {
            const duration = Date.now() - startTime;
            const res = context.switchToHttp().getResponse();

            // Prefer NestJS route URL template (e.g. /employees/:id) over actual URL to avoid PII in logs
            const routeUrl: string =
              req.routeOptions?.url || req.routerPath || req.url;

            await this.db.insert(auditLogs).values({
              userId: req.user?.id ?? null,
              userRole: req.user?.role ?? null,
              action: `${method} ${routeUrl}`,
              resourceType: routeUrl.split('/')[1] ?? 'unknown',
              resourceId: req.params?.id ?? req.params?.employeeId ?? null,
              ipAddress: req.ip ?? null,
              userAgent: req.headers?.['user-agent'] ?? null,
              statusCode: res.statusCode,
              duration,
            });
          } catch (err) {
            // Audit log failure must never break the response
            this.logger.error('Failed to write audit log entry', err);
          }
        },
      }),
    );
  }
}
