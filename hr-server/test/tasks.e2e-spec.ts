/**
 * Tasks & Projects Module — E2E Tests
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

describe('Tasks & Projects Module (e2e)', () => {
  let ctx: TestContext;
  let createdProjectId: string;
  let createdTaskId: string;
  let createdMilestoneId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  // ─── Projects ─────────────────────────────────────────────────────────────

  describe('POST /tasks/projects (create)', () => {
    it('should create a project', async () => {
      const res = await authPost(ctx, '/tasks/projects', {
        name: `E2E Test Project ${Date.now()}`,
        description: 'Test project',
        status: 'active',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdProjectId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/tasks/projects', {});
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/tasks/projects');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /tasks/projects (list)', () => {
    it('should return all projects', async () => {
      const res = await authGet(ctx, '/tasks/projects');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /tasks/projects/:id (findOne)', () => {
    it('should return project by ID', async () => {
      const res = await authGet(ctx, `/tasks/projects/${createdProjectId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', createdProjectId);
    });
  });

  describe('PATCH /tasks/projects/:id (update)', () => {
    it('should update project details', async () => {
      const res = await authPatch(ctx, `/tasks/projects/${createdProjectId}`, {
        name: `Updated Project ${Date.now()}`,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /tasks/projects/:id', () => {
    it('should delete a project', async () => {
      const res = await authDelete(ctx, `/tasks/projects/${createdProjectId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Tasks ────────────────────────────────────────────────────────────────

  describe('POST /tasks (create)', () => {
    it('should create a task', async () => {
      const res = await authPost(ctx, '/tasks', {
        title: `E2E Test Task ${Date.now()}`,
        description: 'Test task',
        priority: 'high',
        status: 'todo',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdTaskId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/tasks', {});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /tasks (list)', () => {
    it('should return all tasks', async () => {
      const res = await authGet(ctx, '/tasks');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should support status filter', async () => {
      const res = await authGet(ctx, '/tasks?status=todo');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /tasks/:id (findOne)', () => {
    it('should return task details by ID', async () => {
      const res = await authGet(ctx, `/tasks/${createdTaskId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', createdTaskId);
    });
  });

  describe('PATCH /tasks/:id (update)', () => {
    it('should update task properties', async () => {
      const res = await authPatch(ctx, `/tasks/${createdTaskId}`, {
        status: 'in_progress',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      const res = await authDelete(ctx, `/tasks/${createdTaskId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Milestones ───────────────────────────────────────────────────────────

  describe('POST /tasks/projects/:id/milestones (create)', () => {
    it('should create a milestone', async () => {
      // Create a new project for milestone tests
      const projectRes = await authPost(ctx, '/tasks/projects', {
        name: `Milestone Project ${Date.now()}`,
        status: 'active',
      });
      const projectId = projectRes.body.data.id;

      const res = await authPost(ctx, `/tasks/projects/${projectId}/milestones`, {
        title: `E2E Milestone ${Date.now()}`,
        dueDate: '2026-08-01',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdMilestoneId = res.body.data.id;
    });
  });

  describe('GET /tasks/projects/:id/milestones', () => {
    it('should return milestones for a project', async () => {
      const projectRes = await authGet(ctx, '/tasks/projects?limit=1');
      if (projectRes.body.data.length > 0) {
        const projectId = projectRes.body.data[0].id;
        const res = await authGet(ctx, `/tasks/projects/${projectId}/milestones`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });
  });

  describe('PATCH /tasks/milestones/:id (update)', () => {
    it('should update a milestone', async () => {
      const res = await authPatch(ctx, `/tasks/milestones/${createdMilestoneId}`, {
        title: 'Updated Milestone',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /tasks/milestones/:id', () => {
    it('should delete a milestone', async () => {
      const res = await authDelete(ctx, `/tasks/milestones/${createdMilestoneId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
