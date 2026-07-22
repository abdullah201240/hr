/**
 * Attendance Settings Module — E2E Tests
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  authGet,
  authPatch,
  authPost,
  authDelete,
  publicGet,
} from './helpers';

describe('Attendance Settings Module (e2e)', () => {
  let ctx: TestContext;
  let createdHolidayId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    if (createdHolidayId) {
      try {
        await authDelete(ctx, `/attendance-settings/holidays/${createdHolidayId}`);
      } catch {
        /* ignore */
      }
    }
    await teardownApp(ctx);
  });

  // ─── GET SETTINGS ────────────────────────────────────────────────────────

  describe('GET /attendance-settings', () => {
    it('should return current attendance settings', async () => {
      const res = await authGet(ctx, '/attendance-settings');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 'default');
      expect(res.body.data).toHaveProperty('startTime');
      expect(res.body.data).toHaveProperty('endTime');
      expect(res.body.data).toHaveProperty('breakStart');
      expect(res.body.data).toHaveProperty('breakEnd');
      expect(res.body.data).toHaveProperty('lateThreshold');
      expect(res.body.data).toHaveProperty('halfDayThreshold');
      expect(res.body.data).toHaveProperty('weeklyHolidays');
      expect(Array.isArray(res.body.data.weeklyHolidays)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/attendance-settings');
      expect(res.status).toBe(401);
    });
  });

  // ─── UPDATE SETTINGS ─────────────────────────────────────────────────────

  describe('PATCH /attendance-settings', () => {
    it('should update office start and end time', async () => {
      const res = await authPatch(ctx, '/attendance-settings', {
        startTime: '08:30',
        endTime: '17:30',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('startTime', '08:30');
      expect(res.body.data).toHaveProperty('endTime', '17:30');
    });

    it('should update break times', async () => {
      const res = await authPatch(ctx, '/attendance-settings', {
        breakStart: '12:30',
        breakEnd: '13:30',
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('breakStart', '12:30');
      expect(res.body.data).toHaveProperty('breakEnd', '13:30');
    });

    it('should update late threshold', async () => {
      const res = await authPatch(ctx, '/attendance-settings', {
        lateThreshold: 20,
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('lateThreshold', 20);
    });

    it('should update half day threshold', async () => {
      const res = await authPatch(ctx, '/attendance-settings', {
        halfDayThreshold: 200,
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('halfDayThreshold', 200);
    });

    it('should update weekly holidays', async () => {
      const res = await authPatch(ctx, '/attendance-settings', {
        weeklyHolidays: ['Friday', 'Saturday'],
      });
      expect(res.status).toBe(200);
      expect(res.body.data.weeklyHolidays).toEqual(['Friday', 'Saturday']);
    });

    it('should reject invalid time format', async () => {
      const res = await authPatch(ctx, '/attendance-settings', {
        startTime: '9am',
      });
      expect(res.status).toBe(400);
    });

    it('should reject late threshold below minimum (1)', async () => {
      const res = await authPatch(ctx, '/attendance-settings', {
        lateThreshold: 0,
      });
      expect(res.status).toBe(400);
    });

    it('should reject late threshold above maximum (120)', async () => {
      const res = await authPatch(ctx, '/attendance-settings', {
        lateThreshold: 121,
      });
      expect(res.status).toBe(400);
    });

    it('should reject half day threshold below minimum (60)', async () => {
      const res = await authPatch(ctx, '/attendance-settings', {
        halfDayThreshold: 30,
      });
      expect(res.status).toBe(400);
    });

    // Restore defaults
    it('should restore original settings', async () => {
      const res = await authPatch(ctx, '/attendance-settings', {
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
        lateThreshold: 15,
        halfDayThreshold: 240,
        weeklyHolidays: ['Saturday', 'Sunday'],
      });
      expect(res.status).toBe(200);
    });
  });

  // ─── HOLIDAYS: CREATE ────────────────────────────────────────────────────

  describe('POST /attendance-settings/holidays (create)', () => {
    it('should create a holiday', async () => {
      const res = await authPost(ctx, '/attendance-settings/holidays', {
        name: `E2E Test Holiday ${Date.now()}`,
        startDate: '2026-12-25',
        endDate: '2026-12-27',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('startDate', '2026-12-25');
      expect(res.body.data).toHaveProperty('endDate', '2026-12-27');
      createdHolidayId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/attendance-settings/holidays', {});
      expect(res.status).toBe(400);
    });

    it('should reject invalid date format', async () => {
      const res = await authPost(ctx, '/attendance-settings/holidays', {
        name: 'Bad Date Holiday',
        startDate: '25-12-2026',
        endDate: '27-12-2026',
      });
      expect(res.status).toBe(400);
    });

    it('should reject empty name', async () => {
      const res = await authPost(ctx, '/attendance-settings/holidays', {
        name: '',
        startDate: '2026-12-25',
        endDate: '2026-12-27',
      });
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated POST', async () => {
      const res = await fetch(
        `${ctx.baseUrl}/${ctx.apiPrefix}/attendance-settings/holidays`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Unauthorized Holiday',
            startDate: '2026-01-01',
            endDate: '2026-01-01',
          }),
        },
      );
      expect(res.status).toBe(401);
    });
  });

  // ─── HOLIDAYS: LIST ──────────────────────────────────────────────────────

  describe('GET /attendance-settings/holidays (list)', () => {
    it('should return all holidays sorted by start date', async () => {
      const res = await authGet(ctx, '/attendance-settings/holidays');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 1) {
        // Verify sorted by startDate ascending
        for (let i = 1; i < res.body.data.length; i++) {
          expect(res.body.data[i].startDate >= res.body.data[i - 1].startDate).toBe(true);
        }
      }
    });
  });

  // ─── HOLIDAYS: UPDATE ────────────────────────────────────────────────────

  describe('PATCH /attendance-settings/holidays/:id (update)', () => {
    it('should update holiday name', async () => {
      const newName = `Updated Holiday ${Date.now()}`;
      const res = await authPatch(
        ctx,
        `/attendance-settings/holidays/${createdHolidayId}`,
        { name: newName },
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', newName);
    });

    it('should update holiday dates', async () => {
      const res = await authPatch(
        ctx,
        `/attendance-settings/holidays/${createdHolidayId}`,
        { startDate: '2026-12-20', endDate: '2026-12-22' },
      );
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('startDate', '2026-12-20');
      expect(res.body.data).toHaveProperty('endDate', '2026-12-22');
    });

    it('should reject invalid date format on update', async () => {
      const res = await authPatch(
        ctx,
        `/attendance-settings/holidays/${createdHolidayId}`,
        { startDate: 'invalid-date' },
      );
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent holiday', async () => {
      const res = await authPatch(
        ctx,
        '/attendance-settings/holidays/00000000-0000-0000-0000-000000000000',
        { name: 'Ghost' },
      );
      expect(res.status).toBe(404);
    });

    it('should reject invalid UUID', async () => {
      const res = await authPatch(
        ctx,
        '/attendance-settings/holidays/not-a-uuid',
        { name: 'Bad' },
      );
      expect(res.status).toBe(400);
    });
  });

  // ─── HOLIDAYS: DELETE ────────────────────────────────────────────────────

  describe('DELETE /attendance-settings/holidays/:id (delete)', () => {
    it('should delete the holiday', async () => {
      const res = await authDelete(
        ctx,
        `/attendance-settings/holidays/${createdHolidayId}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message');
      createdHolidayId = ''; // Prevent double-delete in afterAll
    });

    it('should return 404 for non-existent holiday', async () => {
      const res = await authDelete(
        ctx,
        '/attendance-settings/holidays/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });

    it('should reject invalid UUID', async () => {
      const res = await authDelete(
        ctx,
        '/attendance-settings/holidays/bad-uuid',
      );
      expect(res.status).toBe(400);
    });
  });
});
