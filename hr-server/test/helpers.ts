/**
 * E2E Test Helpers
 * ─────────────────
 * Shared utilities for bootstrapping the NestJS app, authenticating,
 * and making HTTP requests across all e2e test files.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

// ── Types ─────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TestContext {
  app: INestApplication;
  server: any; // supertest-compatible HTTP server
  tokens: TokenPair;
  apiPrefix: string;
}

// ── Bootstrap ─────────────────────────────────────────────────────────────

/**
 * Boot the full NestJS application for e2e testing.
 * Loads .env.test via dotenv so all config values are available.
 */
export async function bootstrapApp(): Promise<TestContext> {
  // Load test env vars
  const dotenv = await import('dotenv');
  dotenv.config({ path: 'test/.env.test', override: true });

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({
      logger: false,
      requestIdHeader: 'x-request-id',
      genReqId: () => randomUUID(),
    }),
  );

  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');

  // Register plugins (same order as main.ts)
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, { global: true, max: 1000, timeWindow: '1 minute' });
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  });

  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.init();

  // Get auth tokens for the test admin user
  const tokens = await loginAsAdmin(app, apiPrefix);

  return {
    app,
    server: app.getHttpServer(),
    tokens,
    apiPrefix,
  };
}

// ── Auth helper ────────────────────────────────────────────────────────────

/**
 * Login as the test admin user and return access + refresh tokens.
 */
async function loginAsAdmin(
  app: INestApplication,
  apiPrefix: string,
): Promise<TokenPair> {
  const email = process.env.TEST_ADMIN_EMAIL || 'admin@test.com';
  const password = process.env.TEST_ADMIN_PASSWORD || 'Admin@123!';

  const server = app.getHttpServer();
  const res = await request(server)
    .post(`/${apiPrefix}/auth/login`)
    .send({ email, password });

  if (res.status !== 200) {
    throw new Error(
      `Test admin login failed (${res.status}): ${JSON.stringify(res.body)}`,
    );
  }

  return {
    accessToken: res.body.data.tokens.accessToken,
    refreshToken: res.body.data.tokens.refreshToken,
  };
}

// ── Request helpers ────────────────────────────────────────────────────────

/** Make an authenticated GET request */
export function authGet(ctx: TestContext, path: string) {
  return request(ctx.server)
    .get(`/${ctx.apiPrefix}${path}`)
    .set('Authorization', `Bearer ${ctx.tokens.accessToken}`);
}

/** Make an authenticated POST request */
export function authPost(ctx: TestContext, path: string, body?: any) {
  const req = request(ctx.server)
    .post(`/${ctx.apiPrefix}${path}`)
    .set('Authorization', `Bearer ${ctx.tokens.accessToken}`);
  return body ? req.send(body) : req;
}

/** Make an authenticated PATCH request */
export function authPatch(ctx: TestContext, path: string, body?: any) {
  const req = request(ctx.server)
    .patch(`/${ctx.apiPrefix}${path}`)
    .set('Authorization', `Bearer ${ctx.tokens.accessToken}`);
  return body ? req.send(body) : req;
}

/** Make an authenticated DELETE request */
export function authDelete(ctx: TestContext, path: string) {
  return request(ctx.server)
    .delete(`/${ctx.apiPrefix}${path}`)
    .set('Authorization', `Bearer ${ctx.tokens.accessToken}`);
}

/** Make an unauthenticated GET request */
export function publicGet(ctx: TestContext, path: string) {
  return request(ctx.server).get(`/${ctx.apiPrefix}${path}`);
}

/** Make an unauthenticated POST request */
export function publicPost(ctx: TestContext, path: string, body?: any) {
  const req = request(ctx.server).post(`/${ctx.apiPrefix}${path}`);
  return body ? req.send(body) : req;
}

// ── Teardown ───────────────────────────────────────────────────────────────

/** Gracefully close the app */
export async function teardownApp(ctx: TestContext): Promise<void> {
  // Logout to blacklist tokens
  try {
    await authPost(ctx, '/auth/logout', {
      refreshToken: ctx.tokens.refreshToken,
    });
  } catch {
    // non-critical
  }
  await ctx.app.close();
}

// ── Test data generators ───────────────────────────────────────────────────

/** Generate a unique email for test isolation */
export function uniqueEmail(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.com`;
}

/** Generate a unique employee ID */
export function uniqueEmployeeId(): string {
  return `EMP-T-${Date.now().toString(36).toUpperCase()}`;
}
