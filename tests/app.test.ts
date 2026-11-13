import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';

describe('app', () => {
  beforeEach(() => {
    vi.stubEnv('ENV', 'dev');
    vi.stubEnv('API_BASE_URL', 'backend');
    vi.stubEnv('API_VERSION', 'v1');
  });

  it('answers the public routes with the standard envelope', async () => {
    for (const path of ['/', '/health']) {
      const res = await request(createApp()).get(path);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Service available.', error: false, code: 200, data: { status: 'up' } });
    }
  });

  it('sends the security headers and hides the framework', async () => {
    const res = await request(createApp()).get('/');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['cache-control']).toBe('no-store, max-age=0');
  });

  it('answers an unknown route, also under the API prefix, with 404', async () => {
    for (const path of ['/nope', '/backend/dev/v1/nope']) {
      const res = await request(createApp()).get(path);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: 'Route not found.', error: true, code: 404, data: null });
    }
  });

  it('answers a malformed JSON body with 400 and no parser detail', async () => {
    const res = await request(createApp()).post('/health').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Invalid request.', error: true, code: 400, data: null });
  });
});
