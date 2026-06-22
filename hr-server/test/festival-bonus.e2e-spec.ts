/**
 * Festival Bonus Module — E2E Tests
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  authGet,
  authPost,
  authPatch,
  authDelete,
  publicGet,
} from './helpers';

describe('Festival Bonus Module (e2e)', () => {
  let ctx: TestContext;
  let createdRuleId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe('POST /festival-bonus-rules (create)', () => {
    it('should create a festival bonus rule', async () => {
      const res = await authPost(ctx, '/festival-bonus-rules', {
        festivalName: `Eid-ul-Fitr ${Date.now()}`,
        bonusType: 'percentage',
        bonusValue: 50,
        applicableYear: 2026,
        eligibilityCriteria: 'All active employees',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('festivalName');
      createdRuleId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/festival-bonus-rules', {});
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/festival-bonus-rules');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /festival-bonus-rules (list)', () => {
    it('should return all festival bonus rules', async () => {
      const res = await authGet(ctx, '/festival-bonus-rules');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PATCH /festival-bonus-rules/:id (update)', () => {
    it('should update a festival bonus rule', async () => {
      const res = await authPatch(ctx, `/festival-bonus-rules/${createdRuleId}`, {
        bonusValue: 60,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /festival-bonus-rules/:id', () => {
    it('should delete a festival bonus rule', async () => {
      const res = await authDelete(ctx, `/festival-bonus-rules/${createdRuleId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
