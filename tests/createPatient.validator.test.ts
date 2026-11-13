import type { Request } from 'express';
import { checkSchema, validationResult } from 'express-validator';
import { describe, expect, it } from 'vitest';

import { ERRORS } from '../src/http/errors.js';
import { createPatientSchema } from '../src/http/validators/createPatient.validator.js';

const validate = async (body: unknown): Promise<string[]> => {
  const req = { body } as Request;
  for (const chain of checkSchema(createPatientSchema)) {
    await chain.run(req);
  }
  return validationResult(req).array().map((error) => error.msg);
};

describe('createPatientSchema', () => {
  it('accepts only the birth date', async () => {
    expect(await validate({ fecha_nacimiento: '1990-05-20' })).toEqual([]);
  });

  it('accepts every field and null for the optional ones', async () => {
    expect(await validate({
      fecha_nacimiento: '1990-05-20', geolocalizacion_lat: 3.45, geolocalizacion_lon: -76.53,
      municipio_id: 5, departamento_id: 2, etnia: 'Mestizo'
    })).toEqual([]);
    expect(await validate({
      fecha_nacimiento: '1990-05-20', geolocalizacion_lat: null, geolocalizacion_lon: null,
      municipio_id: null, departamento_id: null, etnia: null
    })).toEqual([]);
  });

  it('rejects a missing body and a missing birth date', async () => {
    expect(await validate(undefined)).toContain('FECHA_NACIMIENTO_REQUIRED');
    expect(await validate({})).toContain('FECHA_NACIMIENTO_REQUIRED');
  });

  it('rejects a birth date with a wrong type, format or value', async () => {
    expect(await validate({ fecha_nacimiento: 19900520 })).toEqual(['FECHA_NACIMIENTO_INVALID_TYPE']);
    expect(await validate({ fecha_nacimiento: '20/05/1990' })).toEqual(['FECHA_NACIMIENTO_INVALID_FORMAT']);
    expect(await validate({ fecha_nacimiento: '1990-02-30' })).toEqual(['FECHA_NACIMIENTO_INVALID_DATE']);
  });

  it('rejects a birth date before 1900 and accepts the first day of 1900 and a leap day', async () => {
    expect(await validate({ fecha_nacimiento: '1899-12-31' })).toEqual(['FECHA_NACIMIENTO_TOO_OLD']);
    expect(await validate({ fecha_nacimiento: '1900-01-01' })).toEqual([]);
    expect(await validate({ fecha_nacimiento: '2000-02-29' })).toEqual([]);
  });

  it('rejects an id above the int limit of the column and accepts the limit itself', async () => {
    const base = { fecha_nacimiento: '1990-05-20' };
    expect(await validate({ ...base, municipio_id: 2147483648 })).toEqual(['MUNICIPIO_ID_INVALID']);
    expect(await validate({ ...base, departamento_id: 99999999999 })).toEqual(['DEPARTAMENTO_ID_INVALID']);
    expect(await validate({ ...base, municipio_id: 2147483647, departamento_id: 2147483647 })).toEqual([]);
  });

  it('rejects an array in a numeric field, empty or not', async () => {
    const base = { fecha_nacimiento: '1990-05-20' };
    expect(await validate({ ...base, municipio_id: [] })).toEqual(['MUNICIPIO_ID_INVALID']);
    expect(await validate({ ...base, departamento_id: [5] })).toEqual(['DEPARTAMENTO_ID_INVALID']);
    expect(await validate({ ...base, geolocalizacion_lat: [], geolocalizacion_lon: [] }))
      .toEqual(['GEOLOCALIZACION_LAT_INVALID', 'GEOLOCALIZACION_LON_INVALID']);
  });

  it('measures etnia in UTF-16 units like nvarchar(20), so 11 emojis do not fit and 10 do', async () => {
    const base = { fecha_nacimiento: '1990-05-20' };
    expect(await validate({ ...base, etnia: '😀'.repeat(11) })).toEqual(['ETNIA_TOO_LONG']);
    expect(await validate({ ...base, etnia: '😀'.repeat(10) })).toEqual([]);
  });

  it('rejects a birth date in the future', async () => {
    expect(await validate({ fecha_nacimiento: '2999-01-01' })).toEqual(['FECHA_NACIMIENTO_FUTURE']);
  });

  it('rejects coordinates out of range', async () => {
    const base = { fecha_nacimiento: '1990-05-20' };
    expect(await validate({ ...base, geolocalizacion_lat: 91, geolocalizacion_lon: 0 }))
      .toEqual(['GEOLOCALIZACION_LAT_INVALID']);
    expect(await validate({ ...base, geolocalizacion_lat: 0, geolocalizacion_lon: 181 }))
      .toEqual(['GEOLOCALIZACION_LON_INVALID']);
  });

  it('rejects a coordinate sent without its pair', async () => {
    const base = { fecha_nacimiento: '1990-05-20' };
    expect(await validate({ ...base, geolocalizacion_lat: 3.45 })).toEqual(['GEOLOCALIZACION_INCOMPLETE']);
    expect(await validate({ ...base, geolocalizacion_lon: -76.5 })).toEqual(['GEOLOCALIZACION_INCOMPLETE']);
  });

  it('rejects ids that are not positive integers', async () => {
    const base = { fecha_nacimiento: '1990-05-20' };
    expect(await validate({ ...base, municipio_id: 0 })).toEqual(['MUNICIPIO_ID_INVALID']);
    expect(await validate({ ...base, departamento_id: 1.5 })).toEqual(['DEPARTAMENTO_ID_INVALID']);
  });

  it('rejects an empty, blank, non-string or too long etnia', async () => {
    const base = { fecha_nacimiento: '1990-05-20' };
    expect(await validate({ ...base, etnia: '' })).toEqual(['ETNIA_EMPTY']);
    expect(await validate({ ...base, etnia: '   ' })).toEqual(['ETNIA_EMPTY']);
    expect(await validate({ ...base, etnia: 5 })).toEqual(['ETNIA_INVALID_TYPE']);
    expect(await validate({ ...base, etnia: 'x'.repeat(21) })).toEqual(['ETNIA_TOO_LONG']);
    expect(await validate({ ...base, etnia: 'x'.repeat(20) })).toEqual([]);
  });

  it('only reports codes that exist in the dictionary', async () => {
    const codes = await validate({
      fecha_nacimiento: '2999-01-01', geolocalizacion_lat: 100, municipio_id: 0, departamento_id: 0, etnia: ''
    });
    expect(codes.length).toBeGreaterThan(0);
    for (const code of codes) {
      expect(Object.hasOwn(ERRORS, code), code).toBe(true);
    }
  });
});
