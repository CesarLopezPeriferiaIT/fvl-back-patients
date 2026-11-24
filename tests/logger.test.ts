import { describe, expect, it } from 'vitest';

import { summarizeError } from '../src/shared/logger.js';

describe('summarizeError', () => {
  it('keeps only the name and the SQL Server number of a driver error, never its message', () => {
    const error = Object.assign(new Error('Truncated value: etnia-secreta'), {
      name: 'QueryFailedError', driverError: { number: 2628, message: 'Truncated value: etnia-secreta' }
    });
    expect(summarizeError(error)).toEqual({ name: 'QueryFailedError', code: 2628 });
  });

  it('uses the string code of a network error', () => {
    const error = Object.assign(new Error('connect ECONNREFUSED 10.0.0.5:1433'), { code: 'ECONNREFUSED' });
    expect(summarizeError(error)).toEqual({ name: 'Error', code: 'ECONNREFUSED' });
  });

  it('returns only the name when the error has no code', () => {
    expect(summarizeError(new Error('boom'))).toEqual({ name: 'Error', code: undefined });
  });

  it('describes a thrown value that is not an Error by its type', () => {
    expect(summarizeError('texto con datos')).toEqual({ name: 'string' });
  });
});
