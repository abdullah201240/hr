/**
 * Dashboard Module — E2E Tests
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  authGet,
  publicGet,
} from './helpers';

describe('Dashboard Module (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe('GET /dashboard/executive-summary', () => {
    it('should return executive dashboard summary', async () => {
      const res = await authGet(ctx, '/dashboard/executive-summary');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalEmployees');
      expect(res.body.data).toHaveProperty('presentToday');
      expect(res.body.data).toHaveProperty('onLeaveToday');
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/dashboard/executive-summary');
      expect(res.status).toBe(401);
    });
  });
});
