import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { stubApiEnv } from './helpers/env.js';

describe('app', () => {
  beforeEach(() => {
    stubApiEnv();
  });

  it('answers the public routes with the standard envelope', async () => {
    for (const path of ['/', '/health']) {
      const res = await request(createApp()).get(path);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Servicio disponible.', error: false, code: 200, data: { status: 'up' } });
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
      expect(res.body).toEqual({
        message: 'Ruta no encontrada.', error: true, code: 404, data: { error_code: 'ROUTE_NOT_FOUND' }
      });
    }
  });

  it('answers a malformed JSON body with 400 and no parser detail', async () => {
    const res = await request(createApp()).post('/health').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: 'Solicitud inválida.', error: true, code: 400, data: { error_code: 'INVALID_REQUEST' }
    });
  });

  it('answers a body larger than 100 kb with 413', async () => {
    const res = await request(createApp()).post('/health').send({ data: 'x'.repeat(150 * 1024) });
    expect(res.status).toBe(413);
    expect(res.body).toEqual({
      message: 'El cuerpo de la solicitud supera el tamaño permitido.', error: true, code: 413,
      data: { error_code: 'PAYLOAD_TOO_LARGE' }
    });
  });
});
