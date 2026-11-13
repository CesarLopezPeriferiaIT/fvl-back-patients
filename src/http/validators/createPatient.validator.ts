import type { Schema } from 'express-validator';

import { getToday } from '../../shared/date.js';

const OPTIONAL = { options: { values: 'null' as const } };
const MIN_BIRTH_DATE = '1900-01-01';
const MAX_INT = 2147483647;
const ETNIA_MAX_LENGTH = 20;

export const createPatientSchema: Schema = {
  fecha_nacimiento: {
    in: ['body'],
    exists: { errorMessage: 'FECHA_NACIMIENTO_REQUIRED', bail: true },
    isString: { errorMessage: 'FECHA_NACIMIENTO_INVALID_TYPE', bail: true },
    matches: { options: /^\d{4}-\d{2}-\d{2}$/, errorMessage: 'FECHA_NACIMIENTO_INVALID_FORMAT', bail: true },
    isISO8601: { options: { strict: true }, errorMessage: 'FECHA_NACIMIENTO_INVALID_DATE', bail: true },
    custom: {
      options: (value: string) => {
        if (value < MIN_BIRTH_DATE) {
          throw new Error('FECHA_NACIMIENTO_TOO_OLD');
        }
        if (value > getToday()) {
          throw new Error('FECHA_NACIMIENTO_FUTURE');
        }
        return true;
      }
    }
  },
  geolocalizacion_lat: {
    in: ['body'],
    optional: OPTIONAL,
    isArray: { negated: true, errorMessage: 'GEOLOCALIZACION_LAT_INVALID', bail: true },
    isFloat: { options: { min: -90, max: 90 }, errorMessage: 'GEOLOCALIZACION_LAT_INVALID' },
    toFloat: true
  },
  geolocalizacion_lon: {
    in: ['body'],
    optional: OPTIONAL,
    isArray: { negated: true, errorMessage: 'GEOLOCALIZACION_LON_INVALID', bail: true },
    isFloat: { options: { min: -180, max: 180 }, errorMessage: 'GEOLOCALIZACION_LON_INVALID' },
    toFloat: true
  },
  '': {
    custom: {
      options: (_value: unknown, { req }) =>
        ((req.body?.geolocalizacion_lat ?? null) === null) === ((req.body?.geolocalizacion_lon ?? null) === null),
      errorMessage: 'GEOLOCALIZACION_INCOMPLETE'
    }
  },
  municipio_id: {
    in: ['body'],
    optional: OPTIONAL,
    isArray: { negated: true, errorMessage: 'MUNICIPIO_ID_INVALID', bail: true },
    isInt: { options: { min: 1, max: MAX_INT }, errorMessage: 'MUNICIPIO_ID_INVALID' },
    toInt: true
  },
  departamento_id: {
    in: ['body'],
    optional: OPTIONAL,
    isArray: { negated: true, errorMessage: 'DEPARTAMENTO_ID_INVALID', bail: true },
    isInt: { options: { min: 1, max: MAX_INT }, errorMessage: 'DEPARTAMENTO_ID_INVALID' },
    toInt: true
  },
  etnia: {
    in: ['body'],
    optional: OPTIONAL,
    isString: { errorMessage: 'ETNIA_INVALID_TYPE', bail: true },
    trim: true,
    notEmpty: { errorMessage: 'ETNIA_EMPTY', bail: true },
    custom: {
      options: (value: string) => value.length <= ETNIA_MAX_LENGTH,
      errorMessage: 'ETNIA_TOO_LONG'
    }
  }
};
