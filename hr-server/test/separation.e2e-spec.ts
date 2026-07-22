/**
 * Separation Module — E2E Tests
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

describe('Separation Module (e2e)', () => {
  let ctx: TestContext;
  let createdSeparationId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe('POST /separation (create)', () => {
    it('should initiate an offboarding process', async () => {
      const res = await authPost(ctx, '/separation', {
        employeeId: '00000000-0000-0000-0000-000000000001',
        separationType: 'resignation',
        reason: 'E2E test separation',
        noticeDate: '2026-06-21',
        expectedLastDay: '2026-07-21',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdSeparationId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/separation', {});
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/separation');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /separation (list)', () => {
    it('should return all separation records', async () => {
      const res = await authGet(ctx, '/separation');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await authGet(ctx, '/separation?page=1&limit=5');
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /separation/:id (update)', () => {
    it('should update separation clearance status', async () => {
      const res = await authPatch(ctx, `/separation/${createdSeparationId}`, {
        status: 'in_progress',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /separation/:id/settlement', () => {
    it('should get or calculate draft settlement', async () => {
      const res = await authGet(ctx, `/separation/${createdSeparationId}/settlement`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /separation/:id/settlement', () => {
    it('should save or update final settlement', async () => {
      const res = await authPost(ctx, `/separation/${createdSeparationId}/settlement`, {
        basicPay: 30000,
        gratuity: 15000,
        leaveEncashment: 5000,
        deductions: 2000,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /separation/:id/settlement/status', () => {
    it('should update settlement status', async () => {
      const res = await authPatch(ctx, `/separation/${createdSeparationId}/settlement/status`, {
        status: 'paid',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /separation/:id', () => {
    it('should delete a separation record', async () => {
      const res = await authDelete(ctx, `/separation/${createdSeparationId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
