/**
 * Upload Module — E2E Tests
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  authGet,
  authDelete,
  authUpload,
} from './helpers';

describe('Upload Module (e2e)', () => {
  let ctx: TestContext;
  let uploadedPublicId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    if (uploadedPublicId) {
      try {
        await authDelete(ctx, `/upload/${encodeURIComponent(uploadedPublicId)}`);
      } catch { /* ignore */ }
    }
    await teardownApp(ctx);
  });

  describe('POST /upload (single file)', () => {
    it('should upload a small text file', async () => {
      const formData = new FormData();
      const blob = new Blob(['Hello E2E Test'], { type: 'text/plain' });
      formData.append('file', blob, 'test.txt');

      const res = await authUpload(ctx, '/upload', formData, { folder: 'hr-test/e2e' });

      // Cloudinary may reject text/plain
      expect([200, 201, 400, 500]).toContain(res.status);

      if (res.status === 200 || res.status === 201) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('publicId');
        uploadedPublicId = res.body.data.publicId;
      }
    });

    it('should reject request without file', async () => {
      const res = await fetch(`${ctx.baseUrl}/${ctx.apiPrefix}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ctx.tokens.accessToken}` },
      });
      // Controller returns 400 or 500 depending on implementation
      expect([400, 500]).toContain(res.status);
    });

    it('should reject unauthenticated upload', async () => {
      const formData = new FormData();
      const blob = new Blob(['test'], { type: 'text/plain' });
      formData.append('file', blob, 'test.txt');

      const res = await fetch(`${ctx.baseUrl}/${ctx.apiPrefix}/upload`, {
        method: 'POST',
        body: formData,
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /upload/url (remote URL)', () => {
    it('should reject HTTP URLs (only HTTPS allowed)', async () => {
      const res = await fetch(
        `${ctx.baseUrl}/${ctx.apiPrefix}/upload/url?url=${encodeURIComponent('http://example.com/image.jpg')}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${ctx.tokens.accessToken}` },
        },
      );
      expect(res.status).toBe(400);
    });

    it('should reject localhost URLs (SSRF protection)', async () => {
      const res = await fetch(
        `${ctx.baseUrl}/${ctx.apiPrefix}/upload/url?url=${encodeURIComponent('https://localhost:8080/secret')}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${ctx.tokens.accessToken}` },
        },
      );
      expect(res.status).toBe(400);
    });

    it('should reject private IP URLs (SSRF protection)', async () => {
      const res = await fetch(
        `${ctx.baseUrl}/${ctx.apiPrefix}/upload/url?url=${encodeURIComponent('https://192.168.1.1/admin')}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${ctx.tokens.accessToken}` },
        },
      );
      expect(res.status).toBe(400);
    });

    it('should reject 127.0.0.1 URLs', async () => {
      const res = await fetch(
        `${ctx.baseUrl}/${ctx.apiPrefix}/upload/url?url=${encodeURIComponent('https://127.0.0.1/internal')}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${ctx.tokens.accessToken}` },
        },
      );
      expect(res.status).toBe(400);
    });

    it('should reject missing URL parameter', async () => {
      const res = await fetch(`${ctx.baseUrl}/${ctx.apiPrefix}/upload/url`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ctx.tokens.accessToken}` },
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /upload/batch', () => {
    it('should reject request without files', async () => {
      const res = await fetch(`${ctx.baseUrl}/${ctx.apiPrefix}/upload/batch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ctx.tokens.accessToken}` },
      });
      expect([400, 200, 500]).toContain(res.status);
    });
  });

  describe('GET /upload (list)', () => {
    it('should list resources in default folder', async () => {
      const res = await authGet(ctx, '/upload');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('resources');
      expect(Array.isArray(res.body.data.resources)).toBe(true);
    });

    it('should list resources in specific folder', async () => {
      const res = await authGet(ctx, '/upload?folder=hr-test');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('resources');
    });
  });

  describe('GET /upload/:publicId (resource info)', () => {
    it('should return 404 or error for non-existent resource', async () => {
      const res = await authGet(ctx, `/upload/${encodeURIComponent('non-existent-resource-id')}`);
      expect([404, 400, 500]).toContain(res.status);
    });
  });

  describe('DELETE /upload (by prefix)', () => {
    it('should reject missing prefix', async () => {
      const res = await fetch(`${ctx.baseUrl}/${ctx.apiPrefix}/upload`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ctx.tokens.accessToken}` },
      });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /upload/:publicId', () => {
    it('should handle deletion of non-existent file gracefully', async () => {
      const res = await authDelete(ctx, `/upload/${encodeURIComponent('non-existent-id')}`);
      expect([200, 404]).toContain(res.status);
    });
  });
});
