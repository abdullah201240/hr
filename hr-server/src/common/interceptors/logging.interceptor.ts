import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    const { method, url, id: requestId } = request;
    const startTime = Date.now();

    // Log request body for mutations (POST/PATCH/PUT) in development
    const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
    if (isMutation && process.env.NODE_ENV !== 'production') {
      const body = request.body;
      if (body && typeof body === 'object') {
        // Sanitize sensitive fields before logging
        const sanitized = this.sanitizeBody(body as Record<string, any>);
        this.logger.debug(
          `→ ${method} ${url} | Body: ${JSON.stringify(sanitized)}`,
        );
      }
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const status = response.statusCode;
          const statusIcon = this.getStatusIcon(status);
          const statusColor = this.getStatusColor(status);

          this.logger.log(
            `${statusIcon} ${method} ${url} ${statusColor}${status}${this.resetColor()} ${this.formatDuration(duration)} [req:${requestId?.slice(0, 8)}]`,
          );
        },
        error: (err: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `✗ ${method} ${url} ERROR ${this.formatDuration(duration)} | ${err.message}`,
            err.stack,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: Record<string, any>): Record<string, any> {
    const sensitiveFields = [
      'password',
      'currentPassword',
      'newPassword',
      'confirmPassword',
      'refreshToken',
      'accessToken',
      'token',
      'secret',
      'passwordHash',
    ];
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      if (sensitiveFields.includes(key)) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeBody(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private formatDuration(ms: number): string {
    if (ms < 100) return `${ms}ms`;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  private getStatusIcon(status: number): string {
    if (status >= 500) return '🔴';
    if (status >= 400) return '🟡';
    if (status >= 300) return '🔵';
    return '🟢';
  }

  private getStatusColor(status: number): string {
    if (status >= 500) return '\x1b[31m'; // red
    if (status >= 400) return '\x1b[33m'; // yellow
    if (status >= 300) return '\x1b[36m'; // cyan
    return '\x1b[32m'; // green
  }

  private resetColor(): string {
    return '\x1b[0m';
  }
}
