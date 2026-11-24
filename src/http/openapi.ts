import { getApiPrefix } from '../config/env.js';
import type { TOpenApiDocument } from './types/openapi.js';

const envelope = (data: Record<string, unknown>) => ({
  type: 'object',
  properties: {
    message: { type: 'string' },
    error: { type: 'boolean' },
    code: { type: 'integer' },
    data: data
  },
  required: ['message', 'error', 'code', 'data']
});

const errorResponse = (description: string) => ({
  description,
  content: {
    'application/json': {
      schema: envelope({
        type: 'object',
        properties: { error_code: { type: 'string', description: 'Stable key of the error, see src/http/errors.ts' } }
      })
    }
  }
});

const statusPath = (summary: string) => ({
  get: {
    summary,
    tags: ['Status'],
    servers: [{ url: '/' }],
    responses: {
      200: {
        description: 'Service available',
        content: {
          'application/json': {
            schema: envelope({
              type: 'object',
              properties: { status: { type: 'string', example: 'up' } }
            })
          }
        }
      }
    }
  }
});

const PATIENT_FIELDS = {
  paciente_id: { type: 'integer', example: 1 },
  fecha_nacimiento: {
    type: 'string',
    format: 'date',
    example: '1990-05-20',
    description: 'Not before 1900-01-01 and not in the future'
  },
  edad: { type: 'integer', example: 36 },
  geolocalizacion_lat: { type: 'number', nullable: true, example: 3.45 },
  geolocalizacion_lon: { type: 'number', nullable: true, example: -76.53 },
  municipio_id: { type: 'integer', nullable: true, example: 5 },
  departamento_id: { type: 'integer', nullable: true, example: 2 },
  etnia: { type: 'string', nullable: true, maxLength: 20, example: 'Mestizo' }
};

/**
 * Builds the OpenAPI document that lists every endpoint of the service; keep it in sync with the router
 */
export const buildOpenApiDocument = (): TOpenApiDocument => ({
  openapi: '3.0.3',
  info: { title: 'fvl-back-patients', version: '1.0.0', description: 'FVL patient management API' },
  servers: [{ url: getApiPrefix() }],
  tags: [{ name: 'Status' }, { name: 'Patients' }],
  paths: {
    '/': statusPath('Service status'),
    '/health': statusPath('Service health'),
    '/patients': {
      post: {
        summary: 'Register a patient',
        description: 'The age is calculated by the server from fecha_nacimiento; an age sent by the client is ignored.',
        tags: ['Patients'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fecha_nacimiento'],
                properties: {
                  fecha_nacimiento: PATIENT_FIELDS.fecha_nacimiento,
                  geolocalizacion_lat: { ...PATIENT_FIELDS.geolocalizacion_lat, minimum: -90, maximum: 90 },
                  geolocalizacion_lon: { ...PATIENT_FIELDS.geolocalizacion_lon, minimum: -180, maximum: 180 },
                  municipio_id: { ...PATIENT_FIELDS.municipio_id, minimum: 1, maximum: 2147483647 },
                  departamento_id: { ...PATIENT_FIELDS.departamento_id, minimum: 1, maximum: 2147483647 },
                  etnia: { ...PATIENT_FIELDS.etnia, minLength: 1 }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Patient registered successfully',
            content: {
              'application/json': {
                schema: envelope({
                  type: 'object',
                  properties: { patient: { type: 'object', properties: PATIENT_FIELDS } }
                })
              }
            }
          },
          400: errorResponse('Validation failed; the message names the first invalid field'),
          413: errorResponse('The body is larger than 100 kb'),
          503: errorResponse('The database is not available')
        }
      }
    }
  }
});
