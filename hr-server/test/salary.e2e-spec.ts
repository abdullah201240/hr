/**
 * Salary Module — E2E Tests
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

describe('Salary Module (e2e)', () => {
  let ctx: TestContext;
  let createdTemplateId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  // ─── Salary Templates ─────────────────────────────────────────────────────

  describe('POST /salary-templates (create)', () => {
    it('should create a salary template', async () => {
      const res = await authPost(ctx, '/salary-templates', {
        name: `E2E Test Template ${Date.now()}`,
        description: 'Test salary template',
        basicSalary: 30000,
        allowances: [
          { name: 'House Rent', amount: 15000, type: 'fixed' },
          { name: 'Medical', amount: 3000, type: 'fixed' },
        ],
        deductions: [
          { name: 'Tax', amount: 2000, type: 'fixed' },
        ],
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name');
      createdTemplateId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/salary-templates', {});
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/salary-templates');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /salary-templates (list)', () => {
    it('should return all salary templates', async () => {
      const res = await authGet(ctx, '/salary-templates');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /salary-templates/:id (findOne)', () => {
    it('should return template by ID', async () => {
      const res = await authGet(ctx, `/salary-templates/${createdTemplateId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', createdTemplateId);
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await authGet(
        ctx,
        '/salary-templates/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /salary-templates/:id (update)', () => {
    it('should update template details', async () => {
      const res = await authPatch(ctx, `/salary-templates/${createdTemplateId}`, {
        name: `Updated Template ${Date.now()}`,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /salary-templates/:id', () => {
    it('should delete a salary template', async () => {
      const res = await authDelete(ctx, `/salary-templates/${createdTemplateId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Employee Salaries ────────────────────────────────────────────────────

  describe('GET /employee-salaries (list)', () => {
    it('should return all employee salary records', async () => {
      const res = await authGet(ctx, '/employee-salaries');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await authGet(ctx, '/employee-salaries?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.data.meta.page).toBe(1);
    });
  });

  describe('GET /employee-salaries/summary', () => {
    it('should return salary summary statistics', async () => {
      const res = await authGet(ctx, '/employee-salaries/summary');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalEmployees');
      expect(res.body.data).toHaveProperty('averageSalary');
    });
  });

  describe('GET /employee-salaries/:employeeId', () => {
    it('should return active salary for an employee', async () => {
      // Get first employee from employee-salaries list
      const listRes = await authGet(ctx, '/employee-salaries?limit=1');
      if (listRes.body.data.data.length > 0) {
        const employeeId = listRes.body.data.data[0].employeeId;
        const res = await authGet(ctx, `/employee-salaries/${employeeId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('employeeId');
      }
    });
  });

  describe('GET /employee-salaries/:employeeId/history', () => {
    it('should return salary history for an employee', async () => {
      const listRes = await authGet(ctx, '/employee-salaries?limit=1');
      if (listRes.body.data.data.length > 0) {
        const employeeId = listRes.body.data.data[0].employeeId;
        const res = await authGet(ctx, `/employee-salaries/${employeeId}/history`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });
  });
});
