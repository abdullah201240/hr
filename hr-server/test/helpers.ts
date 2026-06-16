/**
 * E2E Test Helpers
 * ─────────────────
 * Uses NestFactory.create + app.listen() + native fetch()
 * because supertest is incompatible with Fastify 5's preParsing hooks.
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import cookie from '@fastify/cookie';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';


// ── Types ─────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TestContext {
  app: NestFastifyApplication;
  baseUrl: string; // e.g. http://127.0.0.1:3099
  tokens: TokenPair;
  apiPrefix: string;
}

export interface TestResponse {
  status: number;
  body: any;
  headers: Headers;
}

// ── Bootstrap ─────────────────────────────────────────────────────────────

/**
 * Boot the full NestJS application for e2e testing.
 * Uses NestFactory.create + listen on a random port.
 */
export async function bootstrapApp(): Promise<TestContext> {
  // Load test env vars
  const dotenv = await import('dotenv');
  dotenv.config({ path: 'test/.env.test', override: true });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      requestIdHeader: 'x-request-id',
      genReqId: () => randomUUID(),
    }),
  );

  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');

  // Register plugins
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  });
  await app.register(cookie, {
    secret: configService.get<string>('jwt.refreshTokenSecret')!,
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

  // Clear rate-limit keys in Redis before each bootstrap to avoid 429 errors
  await clearRateLimitKeys();

  // Use port 0 to get a random available port (avoids EADDRINUSE)
  await app.listen(0, '127.0.0.1');
  const actualUrl = await app.getUrl();
  // Extract port from the URL Fastify reports
  const match = actualUrl.match(/:(\d+)/);
  const port = match ? parseInt(match[1], 10) : 3099;
  const baseUrl = `http://127.0.0.1:${port}`;

  // Get auth tokens for the test admin user
  const tokens = await loginAsAdmin(baseUrl, apiPrefix);

  return {
    app,
    baseUrl,
    tokens,
    apiPrefix,
  };
}

// ── Auth helper ────────────────────────────────────────────────────────────

async function loginAsAdmin(
  baseUrl: string,
  apiPrefix: string,
): Promise<TokenPair> {
  const email = process.env.TEST_ADMIN_EMAIL || 'admin@test.com';
  const password = process.env.TEST_ADMIN_PASSWORD || 'Admin@123!';

  const res = await fetch(`${baseUrl}/${apiPrefix}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Test admin login failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  const setCookieHeader = res.headers.get('set-cookie') || '';
  const match = setCookieHeader.match(/refresh_token=([^;]+)/);
  const refreshToken = match ? decodeURIComponent(match[1]) : '';

  return {
    accessToken: json.data.tokens.accessToken,
    refreshToken,
  };
}


// ── Fetch-based request helpers ───────────────────────────────────────────

/** Internal: perform a fetch and parse JSON body */
async function doFetch(url: string, init?: RequestInit): Promise<TestResponse> {
  const res = await fetch(url, init);
  let body: any;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  return { status: res.status, body, headers: res.headers };
}

function url(ctx: TestContext, path: string): string {
  return `${ctx.baseUrl}/${ctx.apiPrefix}${path}`;
}

function authHeaders(ctx: TestContext): Record<string, string> {
  return { Authorization: `Bearer ${ctx.tokens.accessToken}` };
}

/** Authenticated GET */
export async function authGet(
  ctx: TestContext,
  path: string,
): Promise<TestResponse> {
  return doFetch(url(ctx, path), { headers: authHeaders(ctx) });
}

/** Authenticated POST */
export async function authPost(
  ctx: TestContext,
  path: string,
  body?: any,
): Promise<TestResponse> {
  return doFetch(url(ctx, path), {
    method: 'POST',
    headers: { ...authHeaders(ctx), 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** Authenticated PATCH */
export async function authPatch(
  ctx: TestContext,
  path: string,
  body?: any,
): Promise<TestResponse> {
  return doFetch(url(ctx, path), {
    method: 'PATCH',
    headers: { ...authHeaders(ctx), 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** Authenticated DELETE */
export async function authDelete(
  ctx: TestContext,
  path: string,
): Promise<TestResponse> {
  return doFetch(url(ctx, path), {
    method: 'DELETE',
    headers: authHeaders(ctx),
  });
}

/** Unauthenticated GET */
export async function publicGet(
  ctx: TestContext,
  path: string,
): Promise<TestResponse> {
  return doFetch(url(ctx, path));
}

/** Unauthenticated POST */
export async function publicPost(
  ctx: TestContext,
  path: string,
  body?: any,
): Promise<TestResponse> {
  return doFetch(url(ctx, path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Upload a file via multipart/form-data (for upload tests).
 */
export async function authUpload(
  ctx: TestContext,
  path: string,
  formData: FormData,
  queryParams?: Record<string, string>,
): Promise<TestResponse> {
  let queryStr = '';
  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    queryStr = `?${params.toString()}`;
  }
  return doFetch(`${url(ctx, path)}${queryStr}`, {
    method: 'POST',
    headers: authHeaders(ctx),
    body: formData,
  });
}

// ── Redis cleanup ──────────────────────────────────────────────────────────

/**
 * Clear rate-limit keys from Redis to avoid 429 errors between test runs.
 */
async function clearRateLimitKeys(): Promise<void> {
  const { Redis } = await import('ioredis');
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
  try {
    await redis.connect();
    const keys = await redis.keys('hr:auth:rate:login:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis unavailable — ignore
  } finally {
    await redis.quit().catch(() => {});
  }
}

// ── Teardown ───────────────────────────────────────────────────────────────

export async function teardownApp(ctx: TestContext | undefined): Promise<void> {
  if (!ctx?.app) return;
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

export function uniqueEmail(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.com`;
}

export function uniqueEmployeeId(): string {
  return `EMP-T-${Date.now().toString(36).toUpperCase()}`;
}
