/**
 * Notifications Module — E2E Tests
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

describe('Notifications Module (e2e)', () => {
  let ctx: TestContext;
  let notificationId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe('GET /notifications (list)', () => {
    it('should return notifications for the logged-in user', async () => {
      const res = await authGet(ctx, '/notifications');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
      
      if (res.body.data.data.length > 0) {
        notificationId = res.body.data.data[0].id;
      }
    });

    it('should support pagination', async () => {
      const res = await authGet(ctx, '/notifications?limit=5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should support unread filter', async () => {
      const res = await authGet(ctx, '/notifications?isRead=false');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /notifications/unread-count', () => {
    it('should return unread notification count', async () => {
      const res = await authGet(ctx, '/notifications/unread-count');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('unreadCount');
      expect(typeof res.body.data.unreadCount).toBe('number');
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      if (notificationId) {
        const res = await authPatch(ctx, `/notifications/${notificationId}/read`, {});
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });

    it('should reject invalid UUID', async () => {
      const res = await authPatch(ctx, '/notifications/not-a-uuid/read', {});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /notifications/mark-all-read', () => {
    it('should mark all notifications as read', async () => {
      const res = await authPost(ctx, '/notifications/mark-all-read', {});
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /notifications/:id/archive', () => {
    it('should archive a notification', async () => {
      if (notificationId) {
        const res = await authPatch(ctx, `/notifications/${notificationId}/archive`, {});
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });
  });

  describe('POST /notifications/archive-all-read', () => {
    it('should archive all read notifications', async () => {
      const res = await authPost(ctx, '/notifications/archive-all-read', {});
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should delete a notification', async () => {
      // Get a notification first
      const listRes = await authGet(ctx, '/notifications?limit=1');
      if (listRes.body.data.data.length > 0) {
        const notifId = listRes.body.data.data[0].id;
        const res = await authDelete(ctx, `/notifications/${notifId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });
  });

  describe('GET /notifications/preferences', () => {
    it('should return user notification preferences', async () => {
      const res = await authGet(ctx, '/notifications/preferences');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('pushEnabled');
    });
  });

  describe('PATCH /notifications/preferences', () => {
    it('should update notification preferences', async () => {
      const res = await authPatch(ctx, '/notifications/preferences', {
        pushEnabled: false,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
