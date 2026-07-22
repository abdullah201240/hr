import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../common/cache/cache.service';

@Injectable()
export class NotificationRateLimiter {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Enforce sliding-window rate limit per employee (urgent priority bypasses limits)
   * Priority high is limited to 30/hour, others to 50/hour
   */
  async canDeliver(recipientId: string, priority: string): Promise<boolean> {
    if (priority === 'urgent') {
      return true;
    }

    const now = Date.now();
    const windowStart = now - 3600000; // 1 hour window in ms
    const key = `notif:ratelimit:${recipientId}`;

    const limit = priority === 'high' ? 30 : 50;

    const multi = this.redis.multi();
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zadd(key, now, `${now}-${Math.random()}`);
    multi.zcard(key);
    multi.expire(key, 3600);

    const results = await multi.exec();
    if (!results) {
      return true;
    }

    const count = results[2][1] as number;
    return count <= limit;
  }
}
