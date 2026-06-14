import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { CacheService } from '../../common/cache/cache.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'Database health check' })
  async checkDb() {
    try {
      await this.db.execute(sql`SELECT 1`);
      return { database: 'connected', timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('redis')
  @ApiOperation({ summary: 'Redis health check' })
  async checkRedis() {
    const isAlive = await this.cache.ping();
    return {
      redis: isAlive ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
