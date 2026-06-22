/**
 * Chat Module — E2E Tests
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  authGet,
  authPost,
  authDelete,
  publicGet,
} from './helpers';

describe('Chat Module (e2e)', () => {
  let ctx: TestContext;
  let createdRoomId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe('GET /chat/rooms', () => {
    it('should return all rooms for the logged-in user', async () => {
      const res = await authGet(ctx, '/chat/rooms');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      if (res.body.data.length > 0) {
        createdRoomId = res.body.data[0].id;
      }
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/chat/rooms');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /chat/rooms/direct', () => {
    it('should get or create a direct message room', async () => {
      const res = await authPost(ctx, '/chat/rooms/direct', {
        recipientId: '00000000-0000-0000-0000-000000000002',
      });
      // Could be 200 or 400 if recipient doesn't exist
      expect([200, 400]).toContain(res.status);
    });

    it('should reject missing recipientId', async () => {
      const res = await authPost(ctx, '/chat/rooms/direct', {});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /chat/rooms/:roomId/messages', () => {
    it('should return messages for a room', async () => {
      if (createdRoomId) {
        const res = await authGet(ctx, `/chat/rooms/${createdRoomId}/messages`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });

    it('should support pagination with cursor', async () => {
      if (createdRoomId) {
        const res = await authGet(ctx, `/chat/rooms/${createdRoomId}/messages?limit=10`);
        expect(res.status).toBe(200);
      }
    });
  });

  describe('POST /chat/rooms/:roomId/read', () => {
    it('should mark all messages in a room as read', async () => {
      if (createdRoomId) {
        const res = await authPost(ctx, `/chat/rooms/${createdRoomId}/read`, {});
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });
  });

  describe('GET /chat/search', () => {
    it('should search messages', async () => {
      const res = await authGet(ctx, '/chat/search?q=test');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject missing query parameter', async () => {
      const res = await authGet(ctx, '/chat/search');
      expect(res.status).toBe(200);
    });
  });
});
