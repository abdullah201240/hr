import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { resolveKey, patternOf, type CacheKeyDefinition } from './cache-keys';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Get a cached value by resolved key string.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.error(`Cache GET error [${key}]`, error);
      return null;
    }
  }

  /**
   * Get a cached value using a CacheKeyDefinition + dynamic parts.
   * Automatically uses the definition's default TTL is not applicable here (read-only).
   *
   * @example
   *   await cache.getByKey(CacheKeys.employeeById, '42')
   */
  async getByKey<T>(
    definition: CacheKeyDefinition,
    ...parts: string[]
  ): Promise<T | null> {
    return this.get<T>(resolveKey(definition, ...parts));
  }

  /**
   * Set a value by resolved key string.
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Cache SET error [${key}]`, error);
    }
  }

  /**
   * Set a value using a CacheKeyDefinition + dynamic parts.
   * Uses the definition's default TTL unless overridden.
   *
   * @example
   *   await cache.setByKey(CacheKeys.employeeById, employeeData, '42')
   */
  async setByKey(
    definition: CacheKeyDefinition,
    value: unknown,
    ...parts: string[]
  ): Promise<void> {
    return this.set(resolveKey(definition, ...parts), value, definition.ttl);
  }

  /**
   * Delete by resolved key string.
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Cache DEL error [${key}]`, error);
    }
  }

  /**
   * Delete by CacheKeyDefinition + dynamic parts.
   */
  async delByKey(
    definition: CacheKeyDefinition,
    ...parts: string[]
  ): Promise<void> {
    return this.del(resolveKey(definition, ...parts));
  }

  /**
   * Delete all keys matching a glob pattern.
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const stream = this.redis.scanStream({ match: pattern, count: 100 });
      for await (const keys of stream) {
        if (keys.length > 0) {
          const pipeline = this.redis.pipeline();
          for (const key of keys) {
            pipeline.unlink(key);
          }
          await pipeline.exec();
        }
      }
    } catch (error) {
      this.logger.error(`Cache DEL pattern error [${pattern}]`, error);
    }
  }

  /**
   * Delete all keys matching a CacheKeyDefinition pattern.
   *
   * @example
   *   await cache.delByPattern(CacheKeys.employeeList)
   */
  async delByPattern(definition: CacheKeyDefinition): Promise<void> {
    return this.delPattern(patternOf(definition));
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
