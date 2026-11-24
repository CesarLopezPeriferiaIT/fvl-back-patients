import boom from '@hapi/boom';
import type { NextFunction, Request, Response } from 'express';

import { logger } from '../../shared/logger.js';
import { ERRORS, httpError } from '../errors.js';
import { failure } from '../response.js';
import type { TErrorCode } from '../types/errors.js';

const getStatus = (error: unknown): number => {
  if (boom.isBoom(error)) {
    return error.output.statusCode;
  }
  const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : 500;
};

const getErrorCode = (status: number): TErrorCode => {
  if (status >= 500) {
    return 'INTERNAL_ERROR';
  }
  return status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INVALID_REQUEST';
};

/**
 * Answers any unmatched route with a 404 in the standard envelope
 */
export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(httpError('ROUTE_NOT_FOUND'));
};

/**
 * Turns any thrown error into the standard envelope; only boom errors keep their message, the rest never leak it
 */
export const errorHandler = (error: unknown, _req: Request, res: Response, next: NextFunction): void => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = getStatus(error);
  if (boom.isBoom(error)) {
    res.status(status).json(failure(error.message, status, error.data ?? null));
    return;
  }

  const code = getErrorCode(status);
  if (status >= 500) {
    logger.error('Unhandled error', error);
  }
  res.status(status).json(failure(ERRORS[code].message, status, { error_code: code }));
};
