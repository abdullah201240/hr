/**
 * Designations Module — E2E Tests
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  authGet,
  authPost,
  authPatch,
  authDelete,
} from './helpers';

describe('Designations Module (e2e)', () => {
  let ctx: TestContext;
  let createdDesigId: string;
  const testDesig = {
    name: `Test Designation ${Date.now()}`,
    code: `TDES${Date.now().toString(36).toUpperCase()}`,
    description: 'E2E test designation',
    grade: 'L3',
  };

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    if (createdDesigId) {
      try {
        await authDelete(ctx, `/designations/${createdDesigId}`);
      } catch {
        /* ignore */
      }
    }
    await teardownApp(ctx);
  });

  describe('POST /designations (create)', () => {
    it('should create a designation', async () => {
      const res = await authPost(ctx, '/designations', testDesig);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name', testDesig.name);
      expect(res.body.data).toHaveProperty('code', testDesig.code);
      expect(res.body.data).toHaveProperty('grade', testDesig.grade);
      expect(res.body.data).toHaveProperty('isActive', true);
      createdDesigId = res.body.data.id;
    });

    it('should reject duplicate name', async () => {
      const res = await authPost(ctx, '/designations', {
        name: testDesig.name,
        code: `UNIQ${Date.now()}`,
      });
      expect(res.status).toBe(409);
    });

    it('should reject duplicate code', async () => {
      const res = await authPost(ctx, '/designations', {
        name: `Unique ${Date.now()}`,
        code: testDesig.code,
      });
      expect(res.status).toBe(409);
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/designations', {});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /designations (list)', () => {
    it('should return paginated list', async () => {
      const res = await authGet(ctx, '/designations');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('meta');
      expect(res.body.data.meta).toHaveProperty('total');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await authGet(ctx, '/designations?page=1&limit=3');
      expect(res.status).toBe(200);
      expect(res.body.data.meta.page).toBe(1);
      expect(res.body.data.meta.limit).toBe(3);
    });

    it('should support search', async () => {
      const res = await authGet(
        ctx,
        `/designations?search=${encodeURIComponent(testDesig.name)}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBeGreaterThan(0);
    });

    it('should filter by isActive', async () => {
      const res = await authGet(ctx, '/designations?isActive=true');
      expect(res.status).toBe(200);
      for (const item of res.body.data.data) {
        expect(item.isActive).toBe(true);
      }
    });
  });

  describe('GET /designations/options (dropdown)', () => {
    it('should return active designation options', async () => {
      const res = await authGet(ctx, '/designations/options');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('id');
        expect(res.body.data[0]).toHaveProperty('name');
        expect(res.body.data[0]).toHaveProperty('grade');
      }
    });
  });

  describe('GET /designations/:id (findOne)', () => {
    it('should return designation by ID with employee count', async () => {
      const res = await authGet(ctx, `/designations/${createdDesigId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', createdDesigId);
      expect(res.body.data).toHaveProperty('employeeCount');
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await authGet(
        ctx,
        '/designations/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });

    it('should reject invalid UUID', async () => {
      const res = await authGet(ctx, '/designations/bad-uuid');
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /designations/:id (update)', () => {
    it('should update designation', async () => {
      const newName = `Updated Desig ${Date.now()}`;
      const res = await authPatch(ctx, `/designations/${createdDesigId}`, {
        name: newName,
        grade: 'L4',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', newName);
      expect(res.body.data).toHaveProperty('grade', 'L4');
    });

    it('should reject duplicate name on update', async () => {
      const otherRes = await authPost(ctx, '/designations', {
        name: `Other Desig ${Date.now()}`,
        code: `OT${Date.now().toString(36).toUpperCase()}`,
      });
      expect(otherRes.status).toBe(201);

      const res = await authPatch(ctx, `/designations/${createdDesigId}`, {
        name: otherRes.body.data.name,
      });
      expect(res.status).toBe(409);
      await authDelete(ctx, `/designations/${otherRes.body.data.id}`);
    });
  });

  describe('DELETE /designations/:id (soft delete)', () => {
    it('should deactivate the designation', async () => {
      const res = await authDelete(ctx, `/designations/${createdDesigId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message');
    });
  });
});
