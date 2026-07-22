/**
 * Disciplinary Module — E2E Tests
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

describe('Disciplinary Module (e2e)', () => {
  let ctx: TestContext;
  let createdCaseId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe('POST /disciplinary (create)', () => {
    it('should log a disciplinary case', async () => {
      const res = await authPost(ctx, '/disciplinary', {
        employeeId: '00000000-0000-0000-0000-000000000001',
        violationType: 'misconduct',
        description: 'E2E test disciplinary case',
        severity: 'medium',
        incidentDate: '2026-06-20',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdCaseId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/disciplinary', {});
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/disciplinary');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /disciplinary (list)', () => {
    it('should return all disciplinary cases', async () => {
      const res = await authGet(ctx, '/disciplinary');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await authGet(ctx, '/disciplinary?page=1&limit=5');
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /disciplinary/:id (update)', () => {
    it('should update a disciplinary case', async () => {
      const res = await authPatch(ctx, `/disciplinary/${createdCaseId}`, {
        status: 'resolved',
        resolution: 'Warning issued',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /disciplinary/:id', () => {
    it('should revoke a disciplinary case', async () => {
      const res = await authDelete(ctx, `/disciplinary/${createdCaseId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
