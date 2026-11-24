import boom from '@hapi/boom';

import type { TErrorCode } from './types/errors.js';

export const ERRORS = {
  INVALID_REQUEST: { status: 400, message: 'Solicitud inválida.' },
  FECHA_NACIMIENTO_REQUIRED: { status: 400, message: 'La fecha de nacimiento es obligatoria.' },
  FECHA_NACIMIENTO_INVALID_TYPE: { status: 400, message: 'La fecha de nacimiento debe ser un texto.' },
  FECHA_NACIMIENTO_INVALID_FORMAT: { status: 400, message: 'La fecha de nacimiento debe tener el formato AAAA-MM-DD.' },
  FECHA_NACIMIENTO_INVALID_DATE: { status: 400, message: 'La fecha de nacimiento no es una fecha válida.' },
  FECHA_NACIMIENTO_TOO_OLD: { status: 400, message: 'La fecha de nacimiento no puede ser anterior a 1900-01-01.' },
  FECHA_NACIMIENTO_FUTURE: { status: 400, message: 'La fecha de nacimiento no puede ser futura.' },
  GEOLOCALIZACION_LAT_INVALID: { status: 400, message: 'La latitud debe ser un número entre -90 y 90.' },
  GEOLOCALIZACION_LON_INVALID: { status: 400, message: 'La longitud debe ser un número entre -180 y 180.' },
  GEOLOCALIZACION_INCOMPLETE: { status: 400, message: 'La latitud y la longitud deben enviarse juntas.' },
  MUNICIPIO_ID_INVALID: { status: 400, message: 'El municipio debe ser un número entero positivo.' },
  DEPARTAMENTO_ID_INVALID: { status: 400, message: 'El departamento debe ser un número entero positivo.' },
  ETNIA_INVALID_TYPE: { status: 400, message: 'La etnia debe ser un texto.' },
  ETNIA_EMPTY: { status: 400, message: 'La etnia no puede estar vacía.' },
  ETNIA_TOO_LONG: { status: 400, message: 'La etnia no puede superar los 20 caracteres.' },
  ROUTE_NOT_FOUND: { status: 404, message: 'Ruta no encontrada.' },
  PAYLOAD_TOO_LARGE: { status: 413, message: 'El cuerpo de la solicitud supera el tamaño permitido.' },
  INTERNAL_ERROR: { status: 500, message: 'Error interno del servidor.' },
  PATIENT_REGISTER_UNAVAILABLE: {
    status: 503,
    message: 'No fue posible registrar al paciente en este momento. Intente nuevamente.'
  }
} as const;

/**
 * Builds a boom error from the dictionary; its key reaches the client as data.error_code
 */
export const httpError = (code: TErrorCode): boom.Boom => {
  const { status, message } = ERRORS[code];
  const error = boom.boomify(new Error(message), { statusCode: status });
  error.data = { error_code: code };
  return error;
};

/**
 * Returns the value when it is a key of the dictionary, otherwise INVALID_REQUEST
 */
export const toErrorCode = (value: unknown): TErrorCode =>
  typeof value === 'string' && Object.hasOwn(ERRORS, value) ? (value as TErrorCode) : 'INVALID_REQUEST';
