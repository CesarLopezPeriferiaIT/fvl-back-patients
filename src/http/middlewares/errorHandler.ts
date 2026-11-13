import boom from '@hapi/boom';
import type { NextFunction, Request, Response } from 'express';

import { logger } from '../../shared/logger.js';
import { failure } from '../response.js';

const getStatus = (error: unknown): number => {
  if (boom.isBoom(error)) {
    return error.output.statusCode;
  }
  const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : 500;
};

/**
 * Answers any unmatched route with a 404 in the standard envelope
 */
export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(boom.notFound('Route not found.'));
};

/**
 * Turns any thrown error into the standard envelope; 5xx never leak their message
 */
export const errorHandler = (error: unknown, _req: Request, res: Response, next: NextFunction): void => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = getStatus(error);
  if (status >= 500) {
    logger.error('Unhandled error', error);
    res.status(status).json(failure('Internal server error.', status));
    return;
  }

  const message = boom.isBoom(error) ? error.message : 'Invalid request.';
  const data = boom.isBoom(error) ? (error.data ?? null) : null;
  res.status(status).json(failure(message, status, data));
};
