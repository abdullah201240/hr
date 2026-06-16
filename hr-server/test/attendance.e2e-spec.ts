/**
 * Attendance Module — E2E Tests
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  authGet,
  authPost,
  publicGet,
  publicPost,
} from './helpers';

describe('Attendance Module (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  // ─── CHECK-IN ────────────────────────────────────────────────────────────

  describe('POST /attendance/check-in', () => {
    it('should check in successfully', async () => {
      const res = await authPost(ctx, '/attendance/check-in', {
        location: 'Office',
        ipAddress: '192.168.1.100',
        device: 'Chrome / macOS',
        notes: 'E2E test check-in',
      });
      // 200 if successful, 409 if already checked in today
      expect([200, 409]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('checkIn');
        expect(res.body.data).toHaveProperty('status');
        expect(['present', 'late']).toContain(res.body.data.status);
      }
    });

    it('should reject duplicate check-in for same day', async () => {
      // First check-in already done above
      const res = await authPost(ctx, '/attendance/check-in', {
        location: 'Office',
      });
      expect(res.status).toBe(409);
    });

    it('should reject missing location', async () => {
      const res = await authPost(ctx, '/attendance/check-in', {});
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated check-in', async () => {
      const res = await publicPost(ctx, '/attendance/check-in', {
        location: 'Office',
      });
      expect(res.status).toBe(401);
    });

    it('should accept check-in with optional fields', async () => {
      // This will be 409 since already checked in, but validates DTO acceptance
      const res = await authPost(ctx, '/attendance/check-in', {
        location: 'Remote',
        ipAddress: '10.0.0.1',
        device: 'Firefox / Linux',
        notes: 'Working from home',
      });
      expect([200, 409]).toContain(res.status);
    });
  });

  // ─── CHECK-OUT ───────────────────────────────────────────────────────────

  describe('POST /attendance/check-out', () => {
    it('should check out successfully', async () => {
      const res = await authPost(ctx, '/attendance/check-out', {
        notes: 'E2E test check-out',
      });
      // 200 if successful, 409 if already checked out, 400 if no check-in
      expect([200, 409, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('checkOut');
        expect(res.body.data).toHaveProperty('hours');
        expect(typeof res.body.data.hours).toBe('number');
      }
    });

    it('should reject duplicate check-out', async () => {
      const res = await authPost(ctx, '/attendance/check-out', {});
      // Already checked out above
      expect([409, 400]).toContain(res.status);
    });

    it('should reject unauthenticated check-out', async () => {
      const res = await publicPost(ctx, '/attendance/check-out', {});
      expect(res.status).toBe(401);
    });
  });

  // ─── MY LOGS (Monthly) ───────────────────────────────────────────────────

  describe('GET /attendance/my-logs', () => {
    it('should return monthly attendance logs', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-indexed
      const res = await authGet(
        ctx,
        `/attendance/my-logs?year=${year}&month=${month}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should include day details in logs', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const res = await authGet(
        ctx,
        `/attendance/my-logs?year=${year}&month=${month}`,
      );
      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        const entry = res.body.data[0];
        expect(entry).toHaveProperty('day');
        expect(entry).toHaveProperty('dateStr');
        expect(entry).toHaveProperty('status');
        expect(entry).toHaveProperty('dayName');
      }
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/attendance/my-logs?year=2026&month=0');
      expect(res.status).toBe(401);
    });
  });

  // ─── CORRECTION REQUESTS ─────────────────────────────────────────────────

  describe('POST /attendance/correction', () => {
    it('should submit a correction request', async () => {
      // Use yesterday's date to avoid "today" conflicts
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toLocaleDateString('en-CA'); // YYYY-MM-DD

      const res = await authPost(ctx, '/attendance/correction', {
        date: dateStr,
        proposedCheckIn: '09:00 AM',
        proposedCheckOut: '06:00 PM',
        correctionReason: 'Forgot to check out yesterday',
      });
      // 200 if submitted, 409 if already pending, 400 if validation fails
      expect([200, 409, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('correctionStatus', 'pending');
      }
    });

    it('should reject invalid date format', async () => {
      const res = await authPost(ctx, '/attendance/correction', {
        date: '15-06-2026',
        proposedCheckIn: '09:00 AM',
        proposedCheckOut: '06:00 PM',
        correctionReason: 'Bad date format',
      });
      expect(res.status).toBe(400);
    });

    it('should reject invalid time format', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toLocaleDateString('en-CA');

      const res = await authPost(ctx, '/attendance/correction', {
        date: dateStr,
        proposedCheckIn: '9am',
        proposedCheckOut: '6pm',
        correctionReason: 'Bad time format',
      });
      expect(res.status).toBe(400);
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/attendance/correction', {});
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicPost(ctx, '/attendance/correction', {
        date: '2026-06-15',
        proposedCheckIn: '09:00 AM',
        proposedCheckOut: '06:00 PM',
        correctionReason: 'Test',
      });
      expect(res.status).toBe(401);
    });
  });

  // ─── ADMIN: DAILY LOGS ───────────────────────────────────────────────────

  describe('GET /attendance/daily (admin)', () => {
    it('should return daily attendance for all employees', async () => {
      const today = new Date().toLocaleDateString('en-CA');
      const res = await authGet(ctx, `/attendance/daily?date=${today}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/attendance/daily?date=2026-06-16');
      expect(res.status).toBe(401);
    });
  });

  // ─── ADMIN: PENDING CORRECTIONS ──────────────────────────────────────────

  describe('GET /attendance/corrections/pending (admin)', () => {
    it('should return pending correction requests', async () => {
      const res = await authGet(ctx, '/attendance/corrections/pending');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/attendance/corrections/pending');
      expect(res.status).toBe(401);
    });
  });

  // ─── ADMIN: APPROVE CORRECTION ──────────────────────────────────────────

  describe('POST /attendance/correction/approve/:id (admin)', () => {
    it('should reject invalid UUID', async () => {
      const res = await authPost(
        ctx,
        '/attendance/correction/approve/not-a-uuid',
      );
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent correction', async () => {
      const res = await authPost(
        ctx,
        '/attendance/correction/approve/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });
  });

  // ─── ADMIN: REJECT CORRECTION ────────────────────────────────────────────

  describe('POST /attendance/correction/reject/:id (admin)', () => {
    it('should reject invalid UUID', async () => {
      const res = await authPost(
        ctx,
        '/attendance/correction/reject/bad-uuid',
      );
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent correction', async () => {
      const res = await authPost(
        ctx,
        '/attendance/correction/reject/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });
  });

  // ─── ADMIN: OVERRIDE ATTENDANCE ──────────────────────────────────────────

  describe('POST /attendance/admin/override (admin)', () => {
    it('should override attendance for admin user', async () => {
      // Get admin employee ID from profile
      const meRes = await authGet(ctx, '/auth/me');
      expect(meRes.status).toBe(200);
      const adminId = meRes.body.data.id;

      // Use a past date to avoid conflicts
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      const dateStr = pastDate.toLocaleDateString('en-CA');

      const res = await authPost(ctx, '/attendance/admin/override', {
        employeeId: adminId,
        date: dateStr,
        status: 'present',
        checkIn: '09:00 AM',
        checkOut: '06:00 PM',
        notes: 'Admin override for testing',
      });
      // 200 if successful, 400/409 if conflict
      expect([200, 400, 409]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      }
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/attendance/admin/override', {});
      expect(res.status).toBe(400);
    });

    it('should reject invalid date format', async () => {
      const meRes = await authGet(ctx, '/auth/me');
      const adminId = meRes.body.data.id;

      const res = await authPost(ctx, '/attendance/admin/override', {
        employeeId: adminId,
        date: 'invalid-date',
        status: 'present',
      });
      expect(res.status).toBe(400);
    });

    it('should reject invalid time format', async () => {
      const meRes = await authGet(ctx, '/auth/me');
      const adminId = meRes.body.data.id;

      const res = await authPost(ctx, '/attendance/admin/override', {
        employeeId: adminId,
        date: '2026-06-15',
        status: 'present',
        checkIn: '9am',
      });
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicPost(ctx, '/attendance/admin/override', {
        employeeId: 'some-uuid',
        date: '2026-06-15',
        status: 'present',
      });
      expect(res.status).toBe(401);
    });
  });

  // ─── ROUTE PROTECTION ────────────────────────────────────────────────────

  describe('Route protection', () => {
    it('should protect all attendance routes without auth', async () => {
      const routes = [
        { method: 'GET', path: '/attendance/my-logs?year=2026&month=0' },
        { method: 'GET', path: '/attendance/daily?date=2026-06-16' },
        { method: 'GET', path: '/attendance/corrections/pending' },
      ];

      for (const route of routes) {
        const res = await fetch(
          `${ctx.baseUrl}/${ctx.apiPrefix}${route.path}`,
          { method: route.method },
        );
        expect(res.status).toBe(401);
      }
    });
  });
});
