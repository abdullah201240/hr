/**
 * Recruitment Module — E2E Tests
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

describe('Recruitment Module (e2e)', () => {
  let ctx: TestContext;
  let createdJobId: string;
  let createdCandidateId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  // ─── Job Openings ─────────────────────────────────────────────────────────

  describe('POST /recruitment/jobs (create)', () => {
    it('should create a job opening', async () => {
      const res = await authPost(ctx, '/recruitment/jobs', {
        title: `E2E Test Developer ${Date.now()}`,
        department: 'Engineering',
        openings: 2,
        experienceLevel: 'Mid',
        location: 'Remote',
        status: 'open',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('title');
      createdJobId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/recruitment/jobs', {});
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/recruitment/jobs');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /recruitment/jobs (list)', () => {
    it('should return all job openings', async () => {
      const res = await authGet(ctx, '/recruitment/jobs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /recruitment/jobs/:id (findOne)', () => {
    it('should return job opening by ID', async () => {
      const res = await authGet(ctx, `/recruitment/jobs/${createdJobId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', createdJobId);
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await authGet(
        ctx,
        '/recruitment/jobs/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /recruitment/jobs/:id (update)', () => {
    it('should update job opening details', async () => {
      const res = await authPatch(ctx, `/recruitment/jobs/${createdJobId}`, {
        title: `Updated Job Title ${Date.now()}`,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /recruitment/jobs/:id (archive)', () => {
    it('should archive a job opening', async () => {
      const res = await authDelete(ctx, `/recruitment/jobs/${createdJobId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Candidates ───────────────────────────────────────────────────────────

  describe('POST /recruitment/candidates (create)', () => {
    it('should create a candidate', async () => {
      const res = await authPost(ctx, '/recruitment/candidates', {
        fullName: 'E2E Test Candidate',
        email: `candidate-${Date.now()}@test.com`,
        phone: '+8801700000000',
        position: 'Developer',
        stage: 'applied',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdCandidateId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/recruitment/candidates', {});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /recruitment/candidates (list)', () => {
    it('should return all candidates', async () => {
      const res = await authGet(ctx, '/recruitment/candidates');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /recruitment/candidates/:id (findOne)', () => {
    it('should return candidate details by ID', async () => {
      const res = await authGet(ctx, `/recruitment/candidates/${createdCandidateId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', createdCandidateId);
    });
  });

  describe('PATCH /recruitment/candidates/:id (update)', () => {
    it('should update candidate information', async () => {
      const res = await authPatch(ctx, `/recruitment/candidates/${createdCandidateId}`, {
        fullName: 'Updated Candidate Name',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /recruitment/candidates/:id/stage', () => {
    it('should update candidate stage', async () => {
      const res = await authPatch(ctx, `/recruitment/candidates/${createdCandidateId}/stage`, {
        stage: 'interview',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /recruitment/candidates/:id/interview', () => {
    it('should schedule an interview', async () => {
      const res = await authPatch(ctx, `/recruitment/candidates/${createdCandidateId}/interview`, {
        interviewDate: '2026-07-15T10:00:00Z',
        interviewType: 'technical',
        interviewerName: 'John Doe',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /recruitment/candidates/:id', () => {
    it('should remove a candidate', async () => {
      const res = await authDelete(ctx, `/recruitment/candidates/${createdCandidateId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Analytics ────────────────────────────────────────────────────────────

  describe('GET /recruitment/analytics', () => {
    it('should return recruitment pipeline stats', async () => {
      const res = await authGet(ctx, '/recruitment/analytics');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalJobs');
      expect(res.body.data).toHaveProperty('totalCandidates');
    });
  });
});
