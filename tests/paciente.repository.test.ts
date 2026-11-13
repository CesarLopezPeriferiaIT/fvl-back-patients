import { describe, expect, it, vi } from 'vitest';

import { getDataSource } from '../src/db/data-source.js';
import { createPaciente } from '../src/db/repositories/paciente.repository.js';

vi.mock('../src/db/data-source.js', () => ({ getDataSource: vi.fn() }));

const patient = {
  fecha_nacimiento: '1990-05-20', edad: 36, geolocalizacion_lat: null, geolocalizacion_lon: null,
  municipio_id: null, departamento_id: null, etnia: null
};

const givenInsert = (result: unknown) => {
  const insert = vi.fn().mockResolvedValue(result);
  vi.mocked(getDataSource).mockResolvedValue({ getRepository: () => ({ insert }) } as never);
  return insert;
};

describe('createPaciente', () => {
  it('inserts the patient and returns the generated id', async () => {
    const insert = givenInsert({ identifiers: [{ paciente_id: 7 }] });
    expect(await createPaciente(patient)).toBe(7);
    expect(insert).toHaveBeenCalledWith(patient);
  });

  it('fails when the database does not return an id, instead of answering with a null one', async () => {
    givenInsert({ identifiers: [] });
    await expect(createPaciente(patient)).rejects.toThrow('did not return the paciente_id');
  });
});
