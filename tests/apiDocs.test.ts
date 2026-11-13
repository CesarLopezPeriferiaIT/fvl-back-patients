import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import { buildOpenApiDocument } from '../src/http/openapi.js';
import { createRouter } from '../src/http/routes/index.js';
import { stubApiEnv } from './helpers/env.js';

type TLayer = { route?: { path: string; methods: Record<string, boolean> } };

describe('api docs', () => {
  beforeEach(() => {
    stubApiEnv();
  });

  it('documents every route mounted in the router', () => {
    const paths = buildOpenApiDocument().paths as Record<string, Record<string, unknown>>;
    const layers = createRouter().stack as unknown as TLayer[];
    const mounted = layers.flatMap((layer) =>
      layer.route ? Object.keys(layer.route.methods).map((method) => `${method} ${layer.route?.path}`) : []
    );
    expect(mounted.length).toBeGreaterThan(0);
    for (const route of mounted) {
      const [method, path] = route.split(' ');
      expect(paths[path ?? '']?.[method ?? '']).toBeDefined();
    }
  });

  it('serves the OpenAPI document with the API prefix as server', async () => {
    const res = await request(createApp()).get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.body.servers).toEqual([{ url: '/backend/dev/v1' }]);
    expect(Object.keys(res.body.paths)).toContain('/patients');
  });

  it('serves Swagger UI with a policy that lets it load its own assets', async () => {
    const res = await request(createApp()).get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-security-policy']).toContain("script-src 'self'");
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  it('publishes the docs only when ENV is exactly dev', async () => {
    for (const env of ['qas', 'prd', 'prod', '']) {
      stubApiEnv(env);
      for (const path of ['/api-docs.json', '/api-docs/']) {
        const res = await request(createApp()).get(path);
        expect(res.status, `${env || '(empty)'} ${path}`).toBe(404);
      }
    }
    vi.unstubAllEnvs();
    delete process.env.ENV;
    expect((await request(createApp()).get('/api-docs.json')).status).toBe(404);
  });
});
