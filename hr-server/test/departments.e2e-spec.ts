/**
 * Departments Module — E2E Tests
 * Tests CRUD, pagination, dropdown options, and role guards.
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

describe('Departments Module (e2e)', () => {
  let ctx: TestContext;
  let createdDeptId: string;
  const testDept = {
    name: `Test Dept ${Date.now()}`,
    code: `TD${Date.now().toString(36).toUpperCase()}`,
    description: 'E2E test department',
  };

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    // Cleanup: deactivate created department
    if (createdDeptId) {
      try {
        await authDelete(ctx, `/departments/${createdDeptId}`);
      } catch { /* ignore */ }
    }
    await teardownApp(ctx);
  });

  // ─── POST /departments ─────────────────────────────────────────────

  describe('POST /departments (create)', () => {
    it('should create a department', async () => {
      const res = await authPost(ctx, '/departments', testDept).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name', testDept.name);
      expect(res.body.data).toHaveProperty('code', testDept.code);
      expect(res.body.data).toHaveProperty('isActive', true);

      createdDeptId = res.body.data.id;
    });

    it('should reject duplicate name', async () => {
      const res = await authPost(ctx, '/departments', {
        name: testDept.name,
        code: `UNIQUE${Date.now()}`,
      });

      expect(res.status).toBe(409);
    });

    it('should reject duplicate code', async () => {
      const res = await authPost(ctx, '/departments', {
        name: `Unique Name ${Date.now()}`,
        code: testDept.code,
      });

      expect(res.status).toBe(409);
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/departments', {});
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/departments');
      // GET is public but POST requires auth — test via supertest directly
      const request = require('supertest');
      const postRes = await request(ctx.server)
        .post(`/${ctx.apiPrefix}/departments`)
        .send(testDept);

      expect(postRes.status).toBe(401);
    });
  });

  // ─── GET /departments ──────────────────────────────────────────────

  describe('GET /departments (list)', () => {
    it('should return paginated list', async () => {
      const res = await authGet(ctx, '/departments').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('meta');
      expect(res.body.data.meta).toHaveProperty('total');
      expect(res.body.data.meta).toHaveProperty('page');
      expect(res.body.data.meta).toHaveProperty('limit');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await authGet(ctx, '/departments?page=1&limit=5').expect(200);

      expect(res.body.data.meta.page).toBe(1);
      expect(res.body.data.meta.limit).toBe(5);
      expect(res.body.data.data.length).toBeLessThanOrEqual(5);
    });

    it('should support search', async () => {
      const res = await authGet(ctx, `/departments?search=${testDept.name}`).expect(200);

      expect(res.body.data.data.length).toBeGreaterThan(0);
      expect(res.body.data.data[0]).toHaveProperty('name', testDept.name);
    });
  });

  // ─── GET /departments/options ──────────────────────────────────────

  describe('GET /departments/options (dropdown)', () => {
    it('should return active department options', async () => {
      const res = await authGet(ctx, '/departments/options').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('id');
        expect(res.body.data[0]).toHaveProperty('name');
        expect(res.body.data[0]).toHaveProperty('code');
      }
    });
  });

  // ─── GET /departments/:id ─────────────────────────────────────────

  describe('GET /departments/:id (findOne)', () => {
    it('should return department by ID with employee count', async () => {
      const res = await authGet(ctx, `/departments/${createdDeptId}`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', createdDeptId);
      expect(res.body.data).toHaveProperty('name', testDept.name);
      expect(res.body.data).toHaveProperty('employeeCount');
      expect(typeof res.body.data.employeeCount).toBe('number');
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await authGet(ctx, `/departments/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it('should reject invalid UUID format', async () => {
      const res = await authGet(ctx, '/departments/not-a-uuid');
      expect(res.status).toBe(400);
    });
  });

  // ─── PATCH /departments/:id ────────────────────────────────────────

  describe('PATCH /departments/:id (update)', () => {
    it('should update department name', async () => {
      const newName = `Updated Dept ${Date.now()}`;
      const res = await authPatch(ctx, `/departments/${createdDeptId}`, {
        name: newName,
      }).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', newName);
      testDept.name = newName; // keep for later tests
    });

    it('should reject duplicate name on update', async () => {
      // Create another department first
      const otherRes = await authPost(ctx, '/departments', {
        name: `Other Dept ${Date.now()}`,
        code: `OT${Date.now().toString(36).toUpperCase()}`,
      }).expect(201);

      // Try to update first dept to match the second dept's name
      const res = await authPatch(ctx, `/departments/${createdDeptId}`, {
        name: otherRes.body.data.name,
      });

      expect(res.status).toBe(409);

      // Cleanup
      await authDelete(ctx, `/departments/${otherRes.body.data.id}`);
    });
  });

  // ─── DELETE /departments/:id ───────────────────────────────────────

  describe('DELETE /departments/:id (soft delete)', () => {
    it('should deactivate the department', async () => {
      const res = await authDelete(ctx, `/departments/${createdDeptId}`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message');
    });
  });
});
