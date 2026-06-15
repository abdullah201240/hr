import {
  Controller,
  Get,
  Inject,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { CacheService } from '../../common/cache/cache.service';
import { Public } from '../auth/guards/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  @Public()
  @Get('db')
  @ApiOperation({ summary: 'Database health check' })
  async checkDb() {
    try {
      await this.db.execute(sql`SELECT 1`);
      return { database: 'connected', timestamp: new Date().toISOString() };
    } catch (error) {
      throw new ServiceUnavailableException({
        database: 'disconnected',
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Public()
  @Get('redis')
  @ApiOperation({ summary: 'Redis health check' })
  async checkRedis() {
    const isAlive = await this.cache.ping();
    if (!isAlive) {
      throw new ServiceUnavailableException({
        redis: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
    return { redis: 'connected', timestamp: new Date().toISOString() };
  }
}
