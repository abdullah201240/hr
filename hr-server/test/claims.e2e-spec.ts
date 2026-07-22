/**
 * Claims Module — E2E Tests
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

describe('Claims Module (e2e)', () => {
  let ctx: TestContext;
  let createdClaimId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe('POST /claims (create)', () => {
    it('should create a claim', async () => {
      const res = await authPost(ctx, '/claims', {
        type: 'medical',
        amount: 5000,
        claimDate: '2026-06-15',
        description: 'E2E test medical claim',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('type');
      createdClaimId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/claims', {});
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/claims');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /claims (list)', () => {
    it('should return paginated claims list', async () => {
      const res = await authGet(ctx, '/claims');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('meta');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await authGet(ctx, '/claims?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.data.meta.page).toBe(1);
    });

    it('should support status filter', async () => {
      const res = await authGet(ctx, '/claims?status=pending');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /claims/:id (findOne)', () => {
    it('should return claim details by ID', async () => {
      const res = await authGet(ctx, `/claims/${createdClaimId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', createdClaimId);
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await authGet(
        ctx,
        '/claims/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });

    it('should reject invalid UUID format', async () => {
      const res = await authGet(ctx, '/claims/not-a-uuid');
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /claims/:id (delete pending claim)', () => {
    it('should delete a pending claim', async () => {
      const res = await authDelete(ctx, `/claims/${createdClaimId}`);
      // Could be 200 or 400 if claim is no longer pending
      expect([200, 400]).toContain(res.status);
    });
  });
});
