/**
 * Roles & Permissions Module — E2E Tests
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

describe('Roles & Permissions Module (e2e)', () => {
  let ctx: TestContext;
  let createdRoleId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe('GET /roles/permissions', () => {
    it('should return all system permissions', async () => {
      const res = await authGet(ctx, '/roles/permissions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('resource');
      expect(res.body.data[0]).toHaveProperty('action');
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/roles/permissions');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /roles (list)', () => {
    it('should return all system and custom roles', async () => {
      const res = await authGet(ctx, '/roles');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /roles (create custom role)', () => {
    it('should create a custom role', async () => {
      // Get a permission ID first
      const permRes = await authGet(ctx, '/roles/permissions');
      const permissionIds = permRes.body.data.slice(0, 3).map((p: any) => p.id);

      const res = await authPost(ctx, '/roles', {
        name: `E2E Test Role ${Date.now()}`,
        description: 'Test custom role',
        permissionIds,
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name');
      createdRoleId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/roles', {});
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /roles/:id (update custom role)', () => {
    it('should update a custom role', async () => {
      const permRes = await authGet(ctx, '/roles/permissions');
      const permissionIds = permRes.body.data.slice(0, 5).map((p: any) => p.id);

      const res = await authPatch(ctx, `/roles/${createdRoleId}`, {
        name: `Updated Role ${Date.now()}`,
        description: 'Updated description',
        permissionIds,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name');
    });
  });

  describe('DELETE /roles/:id', () => {
    it('should delete a custom role', async () => {
      const res = await authDelete(ctx, `/roles/${createdRoleId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
