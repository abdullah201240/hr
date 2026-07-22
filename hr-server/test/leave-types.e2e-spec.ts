/**
 * Leave Types Module — E2E Tests
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

describe('Leave Types Module (e2e)', () => {
  let ctx: TestContext;
  let createdId: string;

  const testLeaveType = {
    name: `E2E Leave Type ${Date.now()}`,
    icon: 'Plane',
    color: 'bg-sky-500',
    days: 14,
    paid: true,
    requiresApproval: true,
    requiresDocument: false,
    description: 'E2E test leave type',
    carryForward: true,
    maxCarryOverDays: 5,
    encashment: false,
    isProRata: false,
    sandwichRule: false,
  };

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    if (createdId) {
      try {
        await authDelete(ctx, `/leave-types/${createdId}`);
      } catch {
        /* ignore */
      }
    }
    await teardownApp(ctx);
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────

  describe('POST /leave-types (create)', () => {
    it('should create a leave type', async () => {
      const res = await authPost(ctx, '/leave-types', testLeaveType);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name', testLeaveType.name);
      expect(res.body.data).toHaveProperty('icon', testLeaveType.icon);
      expect(res.body.data).toHaveProperty('color', testLeaveType.color);
      expect(res.body.data).toHaveProperty('days', testLeaveType.days);
      expect(res.body.data).toHaveProperty('paid', true);
      expect(res.body.data).toHaveProperty('carryForward', true);
      expect(res.body.data).toHaveProperty('maxCarryOverDays', 5);
      expect(res.body.data).toHaveProperty('isActive', true);
      createdId = res.body.data.id;
    });

    it('should reject duplicate name', async () => {
      const res = await authPost(ctx, '/leave-types', {
        ...testLeaveType,
        days: 10,
      });
      expect(res.status).toBe(409);
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/leave-types', {});
      expect(res.status).toBe(400);
    });

    it('should reject negative days', async () => {
      const res = await authPost(ctx, '/leave-types', {
        ...testLeaveType,
        name: `Negative Days ${Date.now()}`,
        days: -1,
      });
      expect(res.status).toBe(400);
    });

    it('should reject days exceeding 365', async () => {
      const res = await authPost(ctx, '/leave-types', {
        ...testLeaveType,
        name: `Too Many Days ${Date.now()}`,
        days: 366,
      });
      expect(res.status).toBe(400);
    });

    it('should create with minimal fields (defaults applied)', async () => {
      const res = await authPost(ctx, '/leave-types', {
        name: `Minimal Leave ${Date.now()}`,
        days: 5,
      });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('icon', 'CalendarOff');
      expect(res.body.data).toHaveProperty('color', 'bg-sky-500');
      expect(res.body.data).toHaveProperty('paid', true);
      expect(res.body.data).toHaveProperty('requiresApproval', true);
      // Cleanup
      await authDelete(ctx, `/leave-types/${res.body.data.id}`);
    });

    it('should reject unauthenticated POST', async () => {
      const res = await fetch(`${ctx.baseUrl}/${ctx.apiPrefix}/leave-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testLeaveType),
      });
      expect(res.status).toBe(401);
    });
  });

  // ─── LIST ────────────────────────────────────────────────────────────────

  describe('GET /leave-types (list)', () => {
    it('should return paginated list', async () => {
      const res = await authGet(ctx, '/leave-types');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('meta');
      expect(res.body.data.meta).toHaveProperty('total');
      expect(res.body.data.meta).toHaveProperty('page');
      expect(res.body.data.meta).toHaveProperty('limit');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await authGet(ctx, '/leave-types?page=1&limit=3');
      expect(res.status).toBe(200);
      expect(res.body.data.meta.page).toBe(1);
      expect(res.body.data.meta.limit).toBe(3);
      expect(res.body.data.data.length).toBeLessThanOrEqual(3);
    });

    it('should support search', async () => {
      const res = await authGet(
        ctx,
        `/leave-types?search=${encodeURIComponent(testLeaveType.name)}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBeGreaterThan(0);
    });

    it('should filter by isActive', async () => {
      const res = await authGet(ctx, '/leave-types?isActive=true');
      expect(res.status).toBe(200);
      for (const item of res.body.data.data) {
        expect(item.isActive).toBe(true);
      }
    });
  });

  // ─── OPTIONS (dropdown) ──────────────────────────────────────────────────

  describe('GET /leave-types/options (dropdown)', () => {
    it('should return active leave type options', async () => {
      const res = await authGet(ctx, '/leave-types/options');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('id');
        expect(res.body.data[0]).toHaveProperty('name');
        expect(res.body.data[0]).toHaveProperty('days');
      }
    });

    it('should only return active leave types', async () => {
      const res = await authGet(ctx, '/leave-types/options');
      expect(res.status).toBe(200);
      for (const item of res.body.data) {
        expect(item.isActive).toBe(true);
      }
    });
  });

  // ─── FIND ONE ────────────────────────────────────────────────────────────

  describe('GET /leave-types/:id (findOne)', () => {
    it('should return leave type by ID', async () => {
      const res = await authGet(ctx, `/leave-types/${createdId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', createdId);
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('days');
      expect(res.body.data).toHaveProperty('paid');
      expect(res.body.data).toHaveProperty('carryForward');
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await authGet(
        ctx,
        '/leave-types/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });

    it('should reject invalid UUID format', async () => {
      const res = await authGet(ctx, '/leave-types/not-a-uuid');
      expect(res.status).toBe(400);
    });
  });

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  describe('PATCH /leave-types/:id (update)', () => {
    it('should update leave type name', async () => {
      const newName = `Updated Leave Type ${Date.now()}`;
      const res = await authPatch(ctx, `/leave-types/${createdId}`, {
        name: newName,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', newName);
      testLeaveType.name = newName;
    });

    it('should update days', async () => {
      const res = await authPatch(ctx, `/leave-types/${createdId}`, {
        days: 20,
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('days', 20);
    });

    it('should update boolean fields', async () => {
      const res = await authPatch(ctx, `/leave-types/${createdId}`, {
        paid: false,
        carryForward: false,
        requiresDocument: true,
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('paid', false);
      expect(res.body.data).toHaveProperty('carryForward', false);
      expect(res.body.data).toHaveProperty('requiresDocument', true);
    });

    it('should reject duplicate name on update', async () => {
      // Create another leave type
      const otherRes = await authPost(ctx, '/leave-types', {
        name: `Other Leave ${Date.now()}`,
        days: 3,
      });
      expect(otherRes.status).toBe(201);

      const res = await authPatch(ctx, `/leave-types/${createdId}`, {
        name: otherRes.body.data.name,
      });
      expect(res.status).toBe(409);
      await authDelete(ctx, `/leave-types/${otherRes.body.data.id}`);
    });

    it('should reject negative days on update', async () => {
      const res = await authPatch(ctx, `/leave-types/${createdId}`, {
        days: -5,
      });
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await authPatch(
        ctx,
        '/leave-types/00000000-0000-0000-0000-000000000000',
        { days: 10 },
      );
      expect(res.status).toBe(404);
    });

    it('should reject invalid UUID', async () => {
      const res = await authPatch(ctx, '/leave-types/bad-uuid', { days: 5 });
      expect(res.status).toBe(400);
    });
  });

  // ─── SOFT DELETE (deactivate) ────────────────────────────────────────────

  describe('DELETE /leave-types/:id (soft delete)', () => {
    it('should deactivate the leave type', async () => {
      const res = await authDelete(ctx, `/leave-types/${createdId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message');
      createdId = ''; // Prevent double-delete in afterAll
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await authDelete(
        ctx,
        '/leave-types/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });

    it('should reject invalid UUID', async () => {
      const res = await authDelete(ctx, '/leave-types/bad-uuid');
      expect(res.status).toBe(400);
    });
  });
});
