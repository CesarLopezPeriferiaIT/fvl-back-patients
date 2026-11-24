import { describe, expect, it } from 'vitest';

import { ERRORS, httpError, toErrorCode } from '../src/http/errors.js';

describe('errors dictionary', () => {
  it('builds an error with the status and the Spanish message of its key and the key as error_code', () => {
    const error = httpError('PATIENT_REGISTER_UNAVAILABLE');
    expect(error.output.statusCode).toBe(503);
    expect(error.message).toBe(ERRORS.PATIENT_REGISTER_UNAVAILABLE.message);
    expect(error.data).toEqual({ error_code: 'PATIENT_REGISTER_UNAVAILABLE' });
  });

  it('returns a known key as is and falls back to INVALID_REQUEST for anything else', () => {
    expect(toErrorCode('ETNIA_EMPTY')).toBe('ETNIA_EMPTY');
    expect(toErrorCode('NOT_A_CODE')).toBe('INVALID_REQUEST');
    expect(toErrorCode('toString')).toBe('INVALID_REQUEST');
    expect(toErrorCode(undefined)).toBe('INVALID_REQUEST');
  });

  it('gives every 4xx entry a status below 500 and a message ending in a period', () => {
    for (const [code, { status, message }] of Object.entries(ERRORS)) {
      expect(status, code).toBeGreaterThanOrEqual(400);
      expect(message.endsWith('.'), code).toBe(true);
    }
  });
});
