/**
 * Performance Module — E2E Tests
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  authGet,
  authPost,
  authPatch,
  publicGet,
} from './helpers';

describe('Performance Module (e2e)', () => {
  let ctx: TestContext;
  let createdCycleId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  // ─── Cycles ───────────────────────────────────────────────────────────────

  describe('POST /performance/cycles (create)', () => {
    it('should create an appraisal cycle', async () => {
      const res = await authPost(ctx, '/performance/cycles', {
        name: `E2E Appraisal Cycle ${Date.now()}`,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        year: 2026,
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdCycleId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/performance/cycles', {});
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/performance/cycles');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /performance/cycles (list)', () => {
    it('should return all appraisal cycles', async () => {
      const res = await authGet(ctx, '/performance/cycles');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /performance/cycles/:id', () => {
    it('should return cycle details by ID', async () => {
      const res = await authGet(ctx, `/performance/cycles/${createdCycleId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', createdCycleId);
    });
  });

  // ─── KPIs ─────────────────────────────────────────────────────────────────

  describe('GET /performance (list KPIs)', () => {
    it('should return all KPIs grouped by employee', async () => {
      const res = await authGet(ctx, '/performance');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /performance/employee/:employeeId', () => {
    it('should return KPIs for a specific employee', async () => {
      const res = await authGet(ctx, '/performance/employee/00000000-0000-0000-0000-000000000001');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Appraisals ───────────────────────────────────────────────────────────

  describe('GET /performance/appraisals/cycle/:cycleId', () => {
    it('should return all appraisals for a cycle', async () => {
      const res = await authGet(ctx, `/performance/appraisals/cycle/${createdCycleId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /performance/appraisals/employee/:employeeId/cycle/:cycleId', () => {
    it('should return employee appraisal context', async () => {
      const res = await authGet(
        ctx,
        '/performance/appraisals/employee/00000000-0000-0000-0000-000000000001/cycle/' + createdCycleId,
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
