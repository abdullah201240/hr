import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import compression from '@fastify/compress';
import cookie from '@fastify/cookie';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      requestIdHeader: 'x-request-id',
      genReqId: () => randomUUID(),
    }),
    { bufferLogs: true },
  );

  app.useWebSocketAdapter(new WsAdapter(app));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');

  // ── Security ──────────────────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    originAgentCluster: false,
    crossOriginEmbedderPolicy: false,
  });

  // ── Cookies ───────────────────────────────────────────────────
  await app.register(cookie, {
    secret: configService.get<string>('jwt.refreshTokenSecret')!,
  });

  // ── Compression ───────────────────────────────────────────────
  await app.register(compression, {
    encodings: ['br', 'gzip', 'deflate'], // Brotli preferred (30% smaller)
  });

  // ── Rate limiting ─────────────────────────────────────────────
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
  });

  // ── Multipart (file uploads) ─────────────────────────────────────
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB default
      files: 5, // max 5 files per request
    },
  });

  // ── CORS ──────────────────────────────────────────────────────
  // Uses process.env directly because CORS must be configured before
  // the app is fully initialized and ConfigService is available.
  // NOTE ON CSRF: While credentials is set to true, the application relies solely on
  // Bearer authentication tokens sent via headers. No session cookies are used for auth,
  // making it inherently resistant to CSRF attacks. If cookies are ever introduced for session/auth,
  // cross-origin CSRF protections (e.g. @fastify/csrf) must be implemented.
  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim());
  app.enableCors({
    origin: corsOrigins && corsOrigins.length > 0
      ? corsOrigins
      : ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });

  // ── Global prefix ─────────────────────────────────────────────
  app.setGlobalPrefix(apiPrefix);

  // ── Global pipes ──────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global filters & interceptors ─────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  // ── Logging ───────────────────────────────────────────────────
  app.useLogger(app.get(PinoLogger));

  // ── Swagger (dev only) ────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('HR Management API')
      .setDescription('Enterprise HR Management System API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // ── Graceful shutdown ─────────────────────────────────────────
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(`API prefix: /${apiPrefix}`);
  if (nodeEnv !== 'production') {
    logger.log(`Swagger docs: http://localhost:${port}/docs`);
  }
}

bootstrap();
