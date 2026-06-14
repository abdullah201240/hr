/**
 * Health Module — E2E Tests
 * Tests all public health-check endpoints.
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  publicGet,
} from './helpers';

describe('Health Module (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  // ─── GET /health ──────────────────────────────────────────────────

  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const res = await publicGet(ctx, '/health').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status', 'ok');
      expect(res.body.data).toHaveProperty('timestamp');
      expect(res.body.data).toHaveProperty('uptime');
      expect(typeof res.body.data.uptime).toBe('number');
    });
  });

  // ─── GET /health/db ──────────────────────────────────────────────

  describe('GET /health/db', () => {
    it('should return 200 when database is connected', async () => {
      const res = await publicGet(ctx, '/health/db').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('database', 'connected');
      expect(res.body.data).toHaveProperty('timestamp');
    });
  });

  // ─── GET /health/redis ────────────────────────────────────────────

  describe('GET /health/redis', () => {
    it('should return 200 when Redis is connected', async () => {
      const res = await publicGet(ctx, '/health/redis').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('redis', 'connected');
      expect(res.body.data).toHaveProperty('timestamp');
    });
  });

  // ─── Unknown health route ─────────────────────────────────────────

  describe('GET /health/unknown', () => {
    it('should return 404 for non-existent health route', async () => {
      await publicGet(ctx, '/health/unknown').expect(404);
    });
  });
});
