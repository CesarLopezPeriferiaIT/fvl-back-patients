import { Router } from 'express';
import type { RequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';

import { buildOpenApiDocument } from '../openapi.js';

const DOCS_CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'"
].join('; ');

/**
 * Returns the router that serves Swagger UI at /api-docs and the OpenAPI document at /api-docs.json
 */
export const createApiDocsRouter = (): Router => {
  const router = Router();
  const document = buildOpenApiDocument();

  router.get('/api-docs.json', (_req, res) => {
    res.json(document);
  });
  const applyDocsPolicy: RequestHandler = (_req, res, next) => {
    res.setHeader('Content-Security-Policy', DOCS_CSP);
    next();
  };

  router.use(
    '/api-docs',
    applyDocsPolicy,
    swaggerUi.serve,
    swaggerUi.setup(document, { customSiteTitle: 'fvl-back-patients' })
  );
  return router;
};
