import boom from '@hapi/boom';
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { errorHandler } from '../src/http/middlewares/errorHandler.js';

const buildResponse = (headersSent = false) => {
  const res = { headersSent, status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe('errorHandler', () => {
  it('hides the message of an unexpected error behind a generic 500', () => {
    const res = buildResponse();
    errorHandler(new Error('db password leaked'), {} as Request, res as unknown as Response, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error interno del servidor.', error: true, code: 500, data: { error_code: 'INTERNAL_ERROR' }
    });
  });

  it('keeps the message and data of an error thrown on purpose with boom', () => {
    const res = buildResponse();
    const error = boom.serverUnavailable('Try again.');
    error.data = { error_code: 'unavailable' };
    errorHandler(error, {} as Request, res as unknown as Response, vi.fn());
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ message: 'Try again.', error: true, code: 503, data: { error_code: 'unavailable' } });
  });

  it('delegates to the next handler when the response already started', () => {
    const res = buildResponse(true);
    const next = vi.fn() as NextFunction;
    const error = new Error('late');
    errorHandler(error, {} as Request, res as unknown as Response, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
