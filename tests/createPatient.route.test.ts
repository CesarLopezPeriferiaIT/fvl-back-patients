import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import { createPaciente } from '../src/db/repositories/paciente.repository.js';
import { stubApiEnv } from './helpers/env.js';

vi.mock('../src/db/repositories/paciente.repository.js', () => ({ createPaciente: vi.fn() }));

const URL = '/backend/dev/v1/patients';

describe('POST /patients', () => {
  beforeEach(() => {
    stubApiEnv();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-13T15:00:00Z'));
    vi.mocked(createPaciente).mockResolvedValue(7);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('registers the patient with only the birth date and calculates the age on the server', async () => {
    const res = await request(createApp()).post(URL).send({ fecha_nacimiento: '1990-05-20' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'Paciente registrado correctamente.',
      error: false,
      code: 200,
      data: {
        patient: {
          paciente_id: 7, fecha_nacimiento: '1990-05-20', edad: 36, geolocalizacion_lat: null,
          geolocalizacion_lon: null, municipio_id: null, departamento_id: null, etnia: null
        }
      }
    });
  });

  it('stores the optional fields and ignores the age and any field the schema does not declare', async () => {
    const res = await request(createApp()).post(URL).send({
      fecha_nacimiento: '1990-05-20', geolocalizacion_lat: 3.45, geolocalizacion_lon: -76.53, municipio_id: '5',
      departamento_id: 2, etnia: '  Mestizo ', edad: 99, paciente_id: 123, created_at: '2000-01-01'
    });
    expect(res.status).toBe(200);
    expect(createPaciente).toHaveBeenCalledWith({
      fecha_nacimiento: '1990-05-20', edad: 36, geolocalizacion_lat: 3.45, geolocalizacion_lon: -76.53,
      municipio_id: 5, departamento_id: 2, etnia: 'Mestizo'
    });
  });

  it('answers 400 with the first validation message and never touches the database', async () => {
    const res = await request(createApp()).post(URL).send({ fecha_nacimiento: '2999-01-01' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: 'La fecha de nacimiento no puede ser futura.', error: true, code: 400,
      data: { error_code: 'FECHA_NACIMIENTO_FUTURE' }
    });
    expect(createPaciente).not.toHaveBeenCalled();
  });

  it('answers 400 when the request has no body', async () => {
    const res = await request(createApp()).post(URL);
    expect(res.status).toBe(400);
    expect(res.body.data).toEqual({ error_code: 'FECHA_NACIMIENTO_REQUIRED' });
  });

  it('answers 400 for an out of range id and for an array where a number is expected', async () => {
    for (const body of [{ municipio_id: 99999999999 }, { municipio_id: [5] }, { departamento_id: [] }]) {
      const res = await request(createApp()).post(URL).send({ fecha_nacimiento: '1990-05-20', ...body });
      expect(res.status).toBe(400);
    }
    expect(createPaciente).not.toHaveBeenCalled();
  });

  it('answers 503 without leaking the database error, and logs only its name and code', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.mocked(createPaciente).mockRejectedValue(
      Object.assign(new Error('Login failed for user sa'), { driverError: { number: 18456 } })
    );
    const res = await request(createApp()).post(URL).send({ fecha_nacimiento: '1990-05-20' });
    const logged = stdout.mock.calls.map(([line]) => String(line)).join('');
    expect(logged).toContain('18456');
    expect(logged).not.toContain('Login failed');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      message: 'No fue posible registrar al paciente en este momento. Intente nuevamente.', error: true, code: 503,
      data: { error_code: 'PATIENT_REGISTER_UNAVAILABLE' }
    });
  });
});
