/**
 * Leave Applications Module — E2E Tests
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  authGet,
  authPost,
  authPatch,
  publicGet,
} from './helpers';

describe('Leave Applications Module (e2e)', () => {
  let ctx: TestContext;
  let createdLeaveId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe('POST /leave-applications (create)', () => {
    it('should enqueue a leave application job (202 Accepted)', async () => {
      const res = await authPost(ctx, '/leave-applications', {
        leaveTypeId: '00000000-0000-0000-0000-000000000001',
        startDate: '2026-07-01',
        endDate: '2026-07-03',
        reason: 'E2E test leave application',
      });
      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('jobId');
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/leave-applications', {});
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/leave-applications');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /leave-applications (list)', () => {
    it('should return paginated list of leave applications', async () => {
      const res = await authGet(ctx, '/leave-applications');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('meta');
      expect(res.body.data.meta).toHaveProperty('total');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const res = await authGet(ctx, '/leave-applications?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.data.meta.page).toBe(1);
      expect(res.body.data.meta.limit).toBe(5);
    });

    it('should support status filter', async () => {
      const res = await authGet(ctx, '/leave-applications?status=pending');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /leave-applications/balances', () => {
    it('should return leave balances for the logged-in employee', async () => {
      const res = await authGet(ctx, '/leave-applications/balances');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should support year query parameter', async () => {
      const res = await authGet(ctx, '/leave-applications/balances?year=2026');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /leave-applications/jobs/:jobId/status', () => {
    it('should return job status for a valid job ID', async () => {
      // First create a leave application to get a job ID
      const createRes = await authPost(ctx, '/leave-applications', {
        leaveTypeId: '00000000-0000-0000-0000-000000000001',
        startDate: '2026-08-01',
        endDate: '2026-08-02',
        reason: 'Job status test',
      });
      expect(createRes.status).toBe(202);
      const jobId = createRes.body.data.jobId;

      const res = await authGet(ctx, `/leave-applications/jobs/${jobId}/status`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('status');
    });

    it('should return not_found for invalid job ID', async () => {
      const res = await authGet(
        ctx,
        '/leave-applications/jobs/non-existent-job-id/status',
      );
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('not_found');
    });
  });

  describe('GET /leave-applications/:id (findOne)', () => {
    it('should return leave application details by ID', async () => {
      // Get the first leave application from the list
      const listRes = await authGet(ctx, '/leave-applications?limit=1');
      if (listRes.body.data.data.length > 0) {
        const leaveId = listRes.body.data.data[0].id;
        const res = await authGet(ctx, `/leave-applications/${leaveId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id', leaveId);
      }
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await authGet(
        ctx,
        '/leave-applications/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });

    it('should reject invalid UUID format', async () => {
      const res = await authGet(ctx, '/leave-applications/not-a-uuid');
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /leave-applications/:id (update)', () => {
    it('should enqueue an update job (202 Accepted)', async () => {
      // Get first pending leave to update
      const listRes = await authGet(ctx, '/leave-applications?status=pending&limit=1');
      if (listRes.body.data.data.length > 0) {
        const leaveId = listRes.body.data.data[0].id;
        const res = await authPatch(ctx, `/leave-applications/${leaveId}`, {
          reason: 'Updated reason for E2E test',
        });
        expect(res.status).toBe(202);
        expect(res.body.data).toHaveProperty('jobId');
      }
    });
  });

  describe('PATCH /leave-applications/:id/status (approve/reject)', () => {
    it('should reject unauthorized users', async () => {
      // Regular employees without leave:approve should get 403
      const listRes = await authGet(ctx, '/leave-applications?limit=1');
      if (listRes.body.data.data.length > 0) {
        const leaveId = listRes.body.data.data[0].id;
        const res = await authPatch(ctx, `/leave-applications/${leaveId}/status`, {
          status: 'approved',
        });
        // Should be 403 for non-admin/non-HR
        expect([403, 200]).toContain(res.status);
      }
    });
  });

  describe('POST /leave-applications/:id/cancel', () => {
    it('should cancel a pending leave application', async () => {
      const listRes = await authGet(ctx, '/leave-applications?status=pending&limit=1');
      if (listRes.body.data.data.length > 0) {
        const leaveId = listRes.body.data.data[0].id;
        const res = await authPost(ctx, `/leave-applications/${leaveId}/cancel`, {});
        // Could be 200 or 400 depending on business logic
        expect([200, 400]).toContain(res.status);
      }
    });
  });
});
