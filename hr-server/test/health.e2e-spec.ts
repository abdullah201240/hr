/**
 * Health Module — E2E Tests
 */
import { TestContext, bootstrapApp, teardownApp, publicGet } from './helpers';

describe('Health Module (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const res = await publicGet(ctx, '/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status', 'ok');
      expect(res.body.data).toHaveProperty('timestamp');
      expect(res.body.data).toHaveProperty('uptime');
      expect(typeof res.body.data.uptime).toBe('number');
    });
  });

  describe('GET /health/db', () => {
    it('should return 200 when database is connected', async () => {
      const res = await publicGet(ctx, '/health/db');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('database', 'connected');
      expect(res.body.data).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/redis', () => {
    it('should return 200 when Redis is connected', async () => {
      const res = await publicGet(ctx, '/health/redis');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('redis', 'connected');
      expect(res.body.data).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/unknown', () => {
    it('should return 404 for non-existent health route', async () => {
      const res = await publicGet(ctx, '/health/unknown');
      expect(res.status).toBe(404);
    });
  });
});
