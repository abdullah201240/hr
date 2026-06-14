import { Injectable, Inject, Logger } from '@nestjs/common';
import { REDIS_CLIENT } from '../../common/cache/cache.service.js';
import type Redis from 'ioredis';

const BLACKLIST_PREFIX = 'auth:blacklist:';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Blacklist a specific JWT by its JTI (JWT ID).
   * The key expires after the token's remaining TTL.
   */
  async blacklist(jti: string, ttlSeconds: number): Promise<void> {
    try {
      const key = `${BLACKLIST_PREFIX}${jti}`;
      await this.redis.setex(key, ttlSeconds, '1');
    } catch (error) {
      this.logger.error(`Failed to blacklist token ${jti}`, error);
      // Don't throw — blacklist failure shouldn't block the operation
    }
  }

  /**
   * Check if a JWT has been blacklisted (revoked).
   */
  async isBlacklisted(jti: string): Promise<boolean> {
    try {
      const key = `${BLACKLIST_PREFIX}${jti}`;
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch {
      // If Redis is down, fail open (allow the request) — the token will expire naturally
      return false;
    }
  }
}
