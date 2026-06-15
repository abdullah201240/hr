import {
  Module,
  Global,
  Logger,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT, CacheService } from './cache.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const redis = new Redis({
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            if (times > 10) {
              logger.warn(
                'Redis: max reconnection attempts reached, giving up',
              );
              return null;
            }
            return Math.min(times * 200, 2000);
          },
          lazyConnect: true,
        });

        redis.on('connect', () => logger.log('Redis connected'));
        redis.on('error', (err) => logger.warn(`Redis error: ${err.message}`));

        // Non-blocking connect
        redis.connect().catch((err) => {
          logger.warn(
            `Redis initial connection failed: ${err.message}. Will retry in background.`,
          );
        });

        return redis;
      },
      inject: [ConfigService],
    },
    CacheService,
  ],
  exports: [REDIS_CLIENT, CacheService],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
