import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;

    // Handle PostgreSQL unique violation (error code 23505)
    if (
      exception instanceof Error &&
      'code' in exception &&
      (exception as any).code === '23505'
    ) {
      const conflict = new ConflictException(
        'A record with this value already exists',
      );
      status = conflict.getStatus();
      message = conflict.getResponse() as string;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp['message'] as string) || exception.message;
        if (Array.isArray(resp['message'])) {
          errors = resp['message'] as string[];
          message = 'Validation failed';
        }
      }
    } else if (exception && typeof exception === 'object') {
      const exc = exception as any;
      if (typeof exc.statusCode === 'number') {
        status = exc.statusCode;
        message = exc.message || message;
      } else if (typeof exc.status === 'number') {
        status = exc.status;
        message = exc.message || message;
      }
    }

    // Log ALL errors with request context
    const reqInfo = `${request.method} ${request.url}`;

    if (status >= 500) {
      this.logger.error(
        `[${reqInfo}] Server Error ${status}: ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (status >= 400) {
      const detail = errors ? ` | Details: ${errors.join(', ')}` : '';
      this.logger.warn(
        `[${reqInfo}] Client Error ${status}: ${message}${detail}`,
      );
    }

    response.status(status).send({
      success: false,
      error: {
        statusCode: status,
        message,
        ...(errors && { errors }),
        timestamp: new Date().toISOString(),
      },
    });
  }
}
