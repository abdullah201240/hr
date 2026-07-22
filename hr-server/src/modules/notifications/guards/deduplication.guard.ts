import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../common/cache/cache.service';
import { EmitNotificationDto } from '../dto/emit-notification.dto';

@Injectable()
export class DeduplicationGuard {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Resolve a deduplication key for a notification payload
   */
  resolveDedupKey(dto: EmitNotificationDto): string {
    if (dto.dedupKey) {
      return dto.dedupKey;
    }
    const date = new Date();
    // 5 minute bucket rounding
    const minutes = Math.floor(date.getMinutes() / 5) * 5;
    date.setMinutes(minutes, 0, 0);
    const timeBucket = date.toISOString();
    
    return `${dto.module}:${dto.category}:${dto.recipientId}:${dto.entityId || 'none'}:${timeBucket}`;
  }

  /**
   * Check if a notification with this dedup key has already been sent
   */
  async shouldEmit(dto: EmitNotificationDto): Promise<boolean> {
    const key = this.resolveDedupKey(dto);
    const exists = await this.redis.get(`notif:dedup:${key}`);
    return !exists;
  }

  /**
   * Mark a notification as emitted in Redis with a 5 minute TTL
   */
  async markEmitted(dto: EmitNotificationDto): Promise<void> {
    const key = this.resolveDedupKey(dto);
    await this.redis.setex(`notif:dedup:${key}`, 300, '1');
  }
}
