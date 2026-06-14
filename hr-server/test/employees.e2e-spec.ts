/**
 * Employees Module — E2E Tests
 * Tests async create/update via BullMQ, list, findOne, soft delete, and job status.
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  authGet,
  authPost,
  authPatch,
  authDelete,
  uniqueEmail,
  uniqueEmployeeId,
} from './helpers';

describe('Employees Module (e2e)', () => {
  let ctx: TestContext;
  let departmentId: string;
  let designationId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();

    // Fetch valid department and designation IDs for employee creation
    const deptRes = await authGet(ctx, '/departments/options').expect(200);
    const activeDepts = deptRes.body.data;
    if (activeDepts.length === 0) {
      throw new Error('No active departments found — create one before running employee tests');
    }
    departmentId = activeDepts[0].id;

    const desigRes = await authGet(ctx, '/designations/options').expect(200);
    const activeDesigs = desigRes.body.data;
    if (activeDesigs.length === 0) {
      throw new Error('No active designations found — create one before running employee tests');
    }
    designationId = activeDesigs[0].id;
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  // ─── POST /employees (async create) ────────────────────────────────

  describe('POST /employees (async create)', () => {
    it('should enqueue employee creation and return 202', async () => {
      const dto = {
        employeeId: uniqueEmployeeId(),
        email: uniqueEmail('emp'),
        password: 'Test@1234!',
        fullNameEnglish: 'E2E Test Employee',
        phone: '01700000000',
        religion: 'Islam',
        gender: 'Male',
        dateOfBirth: '1995-01-15',
        nidNumber: 'NID-E2E-001',
        designationId,
        departmentId,
        employeeType: 'Full-time',
        joinDate: '2025-01-01',
      };

      const res = await authPost(ctx, '/employees', dto).expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('jobId');
      expect(res.body.data).toHaveProperty('status', 'queued');
    });

    it('should reject duplicate employee ID', async () => {
      // Get an existing employee ID from the list
      const listRes = await authGet(ctx, '/employees?limit=1').expect(200);
      if (listRes.body.data.data.length > 0) {
        const existingEmpId = listRes.body.data.data[0].employeeId;

        const res = await authPost(ctx, '/employees', {
          employeeId: existingEmpId,
          email: uniqueEmail('dup'),
          password: 'Test@1234!',
          fullNameEnglish: 'Duplicate Test',
          phone: '01700000001',
          religion: 'Islam',
          gender: 'Male',
          dateOfBirth: '1995-01-15',
          nidNumber: 'NID-DUP-001',
          designationId,
          departmentId,
          employeeType: 'Full-time',
          joinDate: '2025-01-01',
        });

        expect(res.status).toBe(409);
      }
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/employees', {});
      expect(res.status).toBe(400);
    });

    it('should reject invalid UUID for departmentId', async () => {
      const res = await authPost(ctx, '/employees', {
        employeeId: uniqueEmployeeId(),
        email: uniqueEmail('bad'),
        password: 'Test@1234!',
        fullNameEnglish: 'Bad UUID Test',
        phone: '01700000002',
        religion: 'Islam',
        gender: 'Male',
        dateOfBirth: '1995-01-15',
        nidNumber: 'NID-BAD-001',
        designationId: 'not-a-uuid',
        departmentId: 'not-a-uuid',
        employeeType: 'Full-time',
        joinDate: '2025-01-01',
      });

      expect(res.status).toBe(400);
    });

    it('should reject weak password', async () => {
      const res = await authPost(ctx, '/employees', {
        employeeId: uniqueEmployeeId(),
        email: uniqueEmail('weak'),
        password: 'weak',
        fullNameEnglish: 'Weak Password Test',
        phone: '01700000003',
        religion: 'Islam',
        gender: 'Male',
        dateOfBirth: '1995-01-15',
        nidNumber: 'NID-WEAK-001',
        designationId,
        departmentId,
        employeeType: 'Full-time',
        joinDate: '2025-01-01',
      });

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /employees (list) ─────────────────────────────────────────

  describe('GET /employees (list)', () => {
    it('should return paginated employee list', async () => {
      const res = await authGet(ctx, '/employees').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('meta');
      expect(res.body.data.meta).toHaveProperty('total');
      expect(res.body.data.meta).toHaveProperty('page');
      expect(res.body.data.meta).toHaveProperty('limit');
      expect(res.body.data.meta).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should include department and designation names in list', async () => {
      const res = await authGet(ctx, '/employees?limit=5').expect(200);

      if (res.body.data.data.length > 0) {
        const emp = res.body.data.data[0];
        expect(emp).toHaveProperty('departmentName');
        expect(emp).toHaveProperty('designationName');
      }
    });

    it('should support pagination', async () => {
      const res = await authGet(ctx, '/employees?page=1&limit=2').expect(200);

      expect(res.body.data.meta.page).toBe(1);
      expect(res.body.data.meta.limit).toBe(2);
      expect(res.body.data.data.length).toBeLessThanOrEqual(2);
    });

    it('should filter by status', async () => {
      const res = await authGet(ctx, '/employees?status=active').expect(200);

      for (const emp of res.body.data.data) {
        expect(emp.status).toBe('active');
      }
    });

    it('should filter by department', async () => {
      const res = await authGet(ctx, `/employees?departmentId=${departmentId}`).expect(200);

      for (const emp of res.body.data.data) {
        expect(emp.departmentId).toBe(departmentId);
      }
    });

    it('should support search by name', async () => {
      const res = await authGet(ctx, '/employees?search=E2E').expect(200);

      // May or may not have results depending on timing
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should sort by joinDate ascending', async () => {
      const res = await authGet(ctx, '/employees?sortBy=joinDate&sortOrder=asc').expect(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });
  });

  // ─── GET /employees/:id (findOne) ──────────────────────────────────

  describe('GET /employees/:id (findOne)', () => {
    it('should return employee with all nested relations', async () => {
      // Get first employee from list
      const listRes = await authGet(ctx, '/employees?limit=1').expect(200);
      if (listRes.body.data.data.length === 0) {
        // skip if no employees
        return;
      }

      const empId = listRes.body.data.data[0].id;
      const res = await authGet(ctx, `/employees/${empId}`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', empId);
      expect(res.body.data).toHaveProperty('departmentName');
      expect(res.body.data).toHaveProperty('designationName');
      expect(res.body.data).toHaveProperty('spouses');
      expect(res.body.data).toHaveProperty('children');
      expect(res.body.data).toHaveProperty('nominees');
      expect(res.body.data).toHaveProperty('bankDetails');
      expect(res.body.data).toHaveProperty('documents');
      expect(res.body.data).not.toHaveProperty('passwordHash');
      expect(res.body.data).not.toHaveProperty('refreshTokenVersion');
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await authGet(ctx, '/employees/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });

    it('should reject invalid UUID format', async () => {
      const res = await authGet(ctx, '/employees/invalid-uuid');
      expect(res.status).toBe(400);
    });
  });

  // ─── PATCH /employees/:id (async update) ───────────────────────────

  describe('PATCH /employees/:id (async update)', () => {
    it('should enqueue employee update and return 202', async () => {
      // Get first employee
      const listRes = await authGet(ctx, '/employees?limit=1').expect(200);
      if (listRes.body.data.data.length === 0) return;

      const empId = listRes.body.data.data[0].id;

      const res = await authPatch(ctx, `/employees/${empId}`, {
        fullNameBangla: 'E2E আপডেট টেস্ট',
      }).expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('jobId');
      expect(res.body.data).toHaveProperty('status', 'queued');
    });

    it('should return 404 for non-existent employee update', async () => {
      const res = await authPatch(ctx, '/employees/00000000-0000-0000-0000-000000000000', {
        fullNameEnglish: 'Ghost',
      });

      expect(res.status).toBe(404);
    });
  });

  // ─── GET /employees/jobs/:jobId ────────────────────────────────────

  describe('GET /employees/jobs/:jobId (job status)', () => {
    it('should return job status', async () => {
      // Enqueue a create job first
      const createRes = await authPost(ctx, '/employees', {
        employeeId: uniqueEmployeeId(),
        email: uniqueEmail('job'),
        password: 'Test@1234!',
        fullNameEnglish: 'Job Status Test',
        phone: '01700000099',
        religion: 'Islam',
        gender: 'Male',
        dateOfBirth: '1995-01-15',
        nidNumber: 'NID-JOB-001',
        designationId,
        departmentId,
        employeeType: 'Full-time',
        joinDate: '2025-01-01',
      }).expect(202);

      const jobId = createRes.body.data.jobId;

      // Wait a bit for the job to be picked up
      await new Promise((r) => setTimeout(r, 2000));

      const res = await authGet(ctx, `/employees/jobs/${jobId}?queue=create`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('jobId', jobId);
      expect(res.body.data).toHaveProperty('status');
      // Status could be 'completed', 'active', 'waiting', etc.
      expect(['completed', 'active', 'waiting', 'delayed', 'failed']).toContain(
        res.body.data.status,
      );
    });

    it('should return not-found for invalid job ID', async () => {
      const res = await authGet(ctx, '/employees/jobs/non-existent-id?queue=create').expect(200);

      expect(res.body.data).toHaveProperty('status', 'not-found');
    });
  });

  // ─── DELETE /employees/:id (soft delete) ───────────────────────────

  describe('DELETE /employees/:id (soft delete)', () => {
    it('should return 404 for non-existent employee', async () => {
      const res = await authDelete(ctx, '/employees/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });

    it('should reject invalid UUID', async () => {
      const res = await authDelete(ctx, '/employees/bad-uuid');
      expect(res.status).toBe(400);
    });
  });
});
