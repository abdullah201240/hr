/**
 * Org Chart Module — E2E Tests
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

describe('Org Chart Module (e2e)', () => {
  let ctx: TestContext;
  let createdNodeId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe('GET /org-chart (get tree)', () => {
    it('should return the full organization chart hierarchy', async () => {
      const res = await authGet(ctx, '/org-chart');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('nodes');
      expect(Array.isArray(res.body.data.nodes)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/org-chart');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /org-chart/node (create)', () => {
    it('should create an org node', async () => {
      const res = await authPost(ctx, '/org-chart/node', {
        title: 'E2E Test Department',
        type: 'department',
        parentId: null,
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdNodeId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/org-chart/node', {});
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /org-chart/node/:id (update)', () => {
    it('should update an org node', async () => {
      const res = await authPatch(ctx, `/org-chart/node/${createdNodeId}`, {
        title: 'Updated Department',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /org-chart/node/:id', () => {
    it('should delete an org node', async () => {
      const res = await authDelete(ctx, `/org-chart/node/${createdNodeId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /org-chart/reset', () => {
    it('should reset org chart tree to default', async () => {
      const res = await authPost(ctx, '/org-chart/reset', {});
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
