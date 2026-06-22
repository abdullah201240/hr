/**
 * Letters Module — E2E Tests
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

describe('Letters Module (e2e)', () => {
  let ctx: TestContext;
  let createdLetterId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe('POST /letters (create)', () => {
    it('should issue a new HR letter', async () => {
      const res = await authPost(ctx, '/letters', {
        employeeId: '00000000-0000-0000-0000-000000000001',
        letterType: 'appointment',
        subject: 'E2E Test Appointment Letter',
        content: 'This is a test appointment letter.',
        issuedDate: '2026-06-21',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdLetterId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/letters', {});
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/letters');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /letters (list)', () => {
    it('should return all HR letters with pagination', async () => {
      const res = await authGet(ctx, '/letters');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('meta');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await authGet(ctx, '/letters?page=1&limit=5');
      expect(res.status).toBe(200);
    });

    it('should support letter type filter', async () => {
      const res = await authGet(ctx, '/letters?letterType=appointment');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /letters/:id (findOne)', () => {
    it('should return letter details by ID', async () => {
      const res = await authGet(ctx, `/letters/${createdLetterId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', createdLetterId);
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await authGet(
        ctx,
        '/letters/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /letters/:id/status', () => {
    it('should update letter status', async () => {
      const res = await authPatch(ctx, `/letters/${createdLetterId}/status`, {
        status: 'delivered',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /letters/:id', () => {
    it('should delete/revoke a letter', async () => {
      const res = await authDelete(ctx, `/letters/${createdLetterId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
