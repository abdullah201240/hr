import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { REDIS_CLIENT } from '../../../common/cache/cache.service.js';
import type Redis from 'ioredis';

const LOGIN_RATE_LIMIT_PREFIX = 'auth:rate:login:';
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 60; // 1 minute

@Injectable()
export class LoginThrottleGuard implements CanActivate {
  private readonly logger = new Logger(LoginThrottleGuard.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const email = request.body?.email || '';
    const key = `${LOGIN_RATE_LIMIT_PREFIX}${ip}:${email}`;

    try {
      const current = await this.redis.incr(key);

      // Set TTL on first attempt
      if (current === 1) {
        await this.redis.expire(key, WINDOW_SECONDS);
      }

      if (current > MAX_ATTEMPTS) {
        const ttl = await this.redis.ttl(key);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many login attempts. Try again in ${ttl} seconds.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      // If Redis is down, allow the request (fail open)
      this.logger.warn('Login throttle guard: Redis unavailable, allowing request');
      return true;
    }
  }
}
