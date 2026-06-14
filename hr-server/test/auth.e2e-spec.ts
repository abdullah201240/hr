/**
 * Auth Module — E2E Tests
 * Tests login, refresh, logout, profile, and change-password endpoints.
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  publicPost,
  publicGet,
  authPost,
  authGet,
  authPatch,
} from './helpers';

describe('Auth Module (e2e)', () => {
  let ctx: TestContext;
  let testRefreshToken: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
    testRefreshToken = ctx.tokens.refreshToken;
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  // ─── POST /auth/login ─────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await publicPost(ctx, '/auth/login', {
        email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
        password: process.env.TEST_ADMIN_PASSWORD || 'Admin@123!',
      }).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
      expect(res.body.data.tokens).toHaveProperty('tokenType', 'Bearer');
      expect(res.body.data.user).toHaveProperty('email');
      expect(res.body.data.user).toHaveProperty('role');
    });

    it('should reject invalid email format', async () => {
      const res = await publicPost(ctx, '/auth/login', {
        email: 'not-an-email',
        password: 'password',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject wrong password', async () => {
      const res = await publicPost(ctx, '/auth/login', {
        email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
        password: 'WrongPassword@123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      const res = await publicPost(ctx, '/auth/login', {
        email: 'nonexistent@fake-domain-12345.com',
        password: 'SomePassword@123!',
      });

      expect(res.status).toBe(401);
    });

    it('should reject empty body', async () => {
      const res = await publicPost(ctx, '/auth/login', {});
      expect(res.status).toBe(400);
    });
  });

  // ─── POST /auth/refresh ───────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('should issue new token pair with valid refresh token', async () => {
      // First login to get a fresh refresh token
      const loginRes = await publicPost(ctx, '/auth/login', {
        email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
        password: process.env.TEST_ADMIN_PASSWORD || 'Admin@123!',
      }).expect(200);

      const refreshToken = loginRes.body.data.tokens.refreshToken;

      const res = await publicPost(ctx, '/auth/refresh', {
        refreshToken,
      }).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await publicPost(ctx, '/auth/refresh', {
        refreshToken: 'invalid.token.here',
      });

      expect(res.status).toBe(401);
    });

    it('should reject expired refresh token', async () => {
      const res = await publicPost(ctx, '/auth/refresh', {
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjF9.expired',
      });

      expect(res.status).toBe(401);
    });

    it('should reject missing refresh token', async () => {
      const res = await publicPost(ctx, '/auth/refresh', {});
      expect(res.status).toBe(400);
    });
  });

  // ─── GET /auth/me ─────────────────────────────────────────────────

  describe('GET /auth/me', () => {
    it('should return profile for authenticated user', async () => {
      const res = await authGet(ctx, '/auth/me').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('role');
      expect(res.body.data).toHaveProperty('fullNameEnglish');
      expect(res.body.data).not.toHaveProperty('passwordHash');
      expect(res.body.data).not.toHaveProperty('refreshTokenVersion');
    });

    it('should reject unauthenticated request', async () => {
      const res = await publicGet(ctx, '/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const request = require('supertest');
      const res = await request(ctx.server)
        .get(`/${ctx.apiPrefix}/auth/me`)
        .set('Authorization', 'Bearer invalid-token-here');

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /auth/logout ────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    it('should logout successfully with refresh token', async () => {
      // Login first to get fresh tokens
      const loginRes = await publicPost(ctx, '/auth/login', {
        email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
        password: process.env.TEST_ADMIN_PASSWORD || 'Admin@123!',
      }).expect(200);

      const accessToken = loginRes.body.data.tokens.accessToken;
      const refreshToken = loginRes.body.data.tokens.refreshToken;

      const request = require('supertest');
      const res = await request(ctx.server)
        .post(`/${ctx.apiPrefix}/auth/logout`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message');

      // Verify the blacklisted access token can't be used
      const meRes = await request(ctx.server)
        .get(`/${ctx.apiPrefix}/auth/me`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meRes.status).toBe(401);
    });

    it('should succeed even without refresh token', async () => {
      const res = await authPost(ctx, '/auth/logout', {}).expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── PATCH /auth/change-password ──────────────────────────────────

  describe('PATCH /auth/change-password', () => {
    it('should reject weak new password', async () => {
      const res = await authPatch(ctx, '/auth/change-password', {
        currentPassword: process.env.TEST_ADMIN_PASSWORD || 'Admin@123!',
        newPassword: 'weak',
      });

      expect(res.status).toBe(400);
    });

    it('should reject wrong current password', async () => {
      const res = await authPatch(ctx, '/auth/change-password', {
        currentPassword: 'WrongCurrent@123!',
        newPassword: 'NewStrong@123!',
      });

      expect(res.status).toBe(400);
    });

    it('should reject missing fields', async () => {
      const res = await authPatch(ctx, '/auth/change-password', {});
      expect(res.status).toBe(400);
    });
  });

  // ─── Route protection ─────────────────────────────────────────────

  describe('Route protection', () => {
    it('should protect /auth/me without Authorization header', async () => {
      await publicGet(ctx, '/auth/me').expect(401);
    });

    it('should allow public routes without auth', async () => {
      await publicGet(ctx, '/health').expect(200);
    });
  });
});
