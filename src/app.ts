import cors from 'cors';
import express from 'express';
import type { Express, Request, Response } from 'express';

import { getAllowedOrigins, getApiPrefix } from './config/env.js';
import { createApiDocsRouter } from './http/middlewares/apiDocs.js';
import { errorHandler, notFoundHandler } from './http/middlewares/errorHandler.js';
import { securityHeaders } from './http/middlewares/securityHeaders.js';
import { success } from './http/response.js';
import { createRouter } from './http/routes/index.js';

const sendStatus = (_req: Request, res: Response): void => {
  const response = success('Servicio disponible.', 200, { status: 'up' });
  res.status(response.code).json(response);
};

/**
 * Builds the Express app with a fixed middleware order: headers, cors, body, docs (dev only), public routes, api routes, errors
 */
export const createApp = (): Express => {
  const app = express();
  app.disable('x-powered-by');
  app.use(...securityHeaders());
  app.use(cors({ origin: getAllowedOrigins() }));
  app.use(express.json({ limit: '100kb' }));
  if (process.env.ENV === 'dev') {
    app.use(createApiDocsRouter());
  }
  app.get('/', sendStatus);
  app.get('/health', sendStatus);
  app.use(getApiPrefix(), createRouter());
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
