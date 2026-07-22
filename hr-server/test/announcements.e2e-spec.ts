/**
 * Announcements Module — E2E Tests
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

describe('Announcements Module (e2e)', () => {
  let ctx: TestContext;
  let createdId: string;

  const testAnnouncement = {
    title: `E2E Test Announcement ${Date.now()}`,
    content: 'This is a test announcement for E2E testing purposes.',
    category: 'info',
    department: 'All Departments',
    status: 'Published',
  };

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    if (createdId) {
      try {
        await authDelete(ctx, `/announcements/${createdId}`);
      } catch {
        /* ignore */
      }
    }
    await teardownApp(ctx);
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────

  describe('POST /announcements (create)', () => {
    it('should create an announcement', async () => {
      const res = await authPost(ctx, '/announcements', testAnnouncement);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('title', testAnnouncement.title);
      expect(res.body.data).toHaveProperty('content', testAnnouncement.content);
      expect(res.body.data).toHaveProperty('category', testAnnouncement.category);
      expect(res.body.data).toHaveProperty('department', testAnnouncement.department);
      expect(res.body.data).toHaveProperty('status', testAnnouncement.status);
      expect(res.body.data).toHaveProperty('date');
      createdId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await authPost(ctx, '/announcements', {});
      expect(res.status).toBe(400);
    });

    it('should reject invalid category', async () => {
      const res = await authPost(ctx, '/announcements', {
        ...testAnnouncement,
        title: `Invalid Cat ${Date.now()}`,
        category: 'invalid-category',
      });
      expect(res.status).toBe(400);
    });

    it('should reject invalid status', async () => {
      const res = await authPost(ctx, '/announcements', {
        ...testAnnouncement,
        title: `Invalid Status ${Date.now()}`,
        status: 'InvalidStatus',
      });
      expect(res.status).toBe(400);
    });

    it('should reject title exceeding 255 characters', async () => {
      const res = await authPost(ctx, '/announcements', {
        ...testAnnouncement,
        title: 'A'.repeat(256),
      });
      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated POST', async () => {
      const res = await fetch(`${ctx.baseUrl}/${ctx.apiPrefix}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testAnnouncement),
      });
      expect(res.status).toBe(401);
    });

    it('should create announcement with Draft status', async () => {
      const res = await authPost(ctx, '/announcements', {
        ...testAnnouncement,
        title: `Draft Announcement ${Date.now()}`,
        status: 'Draft',
      });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('status', 'Draft');
      // Clean up
      await authDelete(ctx, `/announcements/${res.body.data.id}`);
    });
  });

  // ─── LIST ────────────────────────────────────────────────────────────────

  describe('GET /announcements (list)', () => {
    it('should return all announcements', async () => {
      const res = await authGet(ctx, '/announcements');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should include date in YYYY-MM-DD format', async () => {
      const res = await authGet(ctx, '/announcements');
      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        const dateStr = res.body.data[0].date;
        expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('should reject unauthenticated GET', async () => {
      const res = await publicGet(ctx, '/announcements');
      expect(res.status).toBe(401);
    });
  });

  // ─── FIND ONE ────────────────────────────────────────────────────────────

  describe('GET /announcements/:id (findOne)', () => {
    it('should return announcement by ID', async () => {
      const res = await authGet(ctx, `/announcements/${createdId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', createdId);
      expect(res.body.data).toHaveProperty('title');
      expect(res.body.data).toHaveProperty('content');
      expect(res.body.data).toHaveProperty('date');
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await authGet(
        ctx,
        '/announcements/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });
  });

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  describe('PATCH /announcements/:id (update)', () => {
    it('should update announcement title', async () => {
      const newTitle = `Updated Announcement ${Date.now()}`;
      const res = await authPatch(ctx, `/announcements/${createdId}`, {
        title: newTitle,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('title', newTitle);
      testAnnouncement.title = newTitle;
    });

    it('should update category', async () => {
      const res = await authPatch(ctx, `/announcements/${createdId}`, {
        category: 'warning',
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('category', 'warning');
    });

    it('should update status to Draft', async () => {
      const res = await authPatch(ctx, `/announcements/${createdId}`, {
        status: 'Draft',
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('status', 'Draft');
    });

    it('should update multiple fields at once', async () => {
      const res = await authPatch(ctx, `/announcements/${createdId}`, {
        title: `Multi Update ${Date.now()}`,
        content: 'Updated content for multi-field test',
        department: 'Engineering',
        status: 'Published',
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('department', 'Engineering');
      expect(res.body.data).toHaveProperty('status', 'Published');
    });

    it('should reject invalid category on update', async () => {
      const res = await authPatch(ctx, `/announcements/${createdId}`, {
        category: 'nonexistent',
      });
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent ID update', async () => {
      const res = await authPatch(
        ctx,
        '/announcements/00000000-0000-0000-0000-000000000000',
        { title: 'Ghost' },
      );
      expect(res.status).toBe(404);
    });
  });

  // ─── DELETE ──────────────────────────────────────────────────────────────

  describe('DELETE /announcements/:id (delete)', () => {
    it('should delete the announcement', async () => {
      const res = await authDelete(ctx, `/announcements/${createdId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('success', true);
      createdId = ''; // Prevent double-delete in afterAll
    });

    it('should return 404 for already-deleted announcement', async () => {
      // Use a fresh announcement to test delete-then-refetch
      const createRes = await authPost(ctx, '/announcements', {
        title: `Delete Test ${Date.now()}`,
        content: 'Will be deleted',
        category: 'info',
        department: 'All Departments',
        status: 'Published',
      });
      expect(createRes.status).toBe(201);
      const id = createRes.body.data.id;

      const deleteRes = await authDelete(ctx, `/announcements/${id}`);
      expect(deleteRes.status).toBe(200);

      const getRes = await authGet(ctx, `/announcements/${id}`);
      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent ID delete', async () => {
      const res = await authDelete(
        ctx,
        '/announcements/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });
  });
});
