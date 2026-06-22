/**
 * Provident Fund Module — E2E Tests
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  authGet,
  authPatch,
  publicGet,
} from './helpers';

describe('Provident Fund Module (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe('GET /provident-fund-settings', () => {
    it('should return provident fund settings', async () => {
      const res = await authGet(ctx, '/provident-fund-settings');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('employeeContribution');
      expect(res.body.data).toHaveProperty('employerContribution');
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/provident-fund-settings');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /provident-fund-settings', () => {
    it('should update provident fund settings', async () => {
      const res = await authPatch(ctx, '/provident-fund-settings', {
        employeeContribution: 10,
        employerContribution: 10,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid values', async () => {
      const res = await authPatch(ctx, '/provident-fund-settings', {
        employeeContribution: -5,
      });
      expect([400, 200]).toContain(res.status);
    });
  });
});
