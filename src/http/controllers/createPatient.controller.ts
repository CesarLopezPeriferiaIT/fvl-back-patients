import type { NextFunction, Request, Response } from 'express';
import { matchedData, validationResult } from 'express-validator';

import { createPaciente } from '../../db/repositories/paciente.repository.js';
import { calculateAge, getToday } from '../../shared/date.js';
import { logger, summarizeError } from '../../shared/logger.js';
import { httpError, toErrorCode } from '../errors.js';
import { success } from '../response.js';
import type { TCreatePatientBody } from '../types/createPatient.js';

/**
 * Registers a patient; the age is calculated from fecha_nacimiento and never taken from the client
 */
export const createPatientController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw httpError(toErrorCode(errors.array()[0]?.msg));
    }

    const body = matchedData<TCreatePatientBody>(req, { locations: ['body'] });
    const patient = {
      fecha_nacimiento: body.fecha_nacimiento,
      edad: calculateAge(body.fecha_nacimiento, getToday()),
      geolocalizacion_lat: body.geolocalizacion_lat ?? null,
      geolocalizacion_lon: body.geolocalizacion_lon ?? null,
      municipio_id: body.municipio_id ?? null,
      departamento_id: body.departamento_id ?? null,
      etnia: body.etnia ?? null
    };

    let pacienteId: number;
    try {
      pacienteId = await createPaciente(patient);
    } catch (error) {
      logger.error('Patient insert failed', summarizeError(error));
      throw httpError('PATIENT_REGISTER_UNAVAILABLE');
    }

    const response = success('Paciente registrado correctamente.', 200, { patient: { paciente_id: pacienteId, ...patient } });
    res.status(response.code).json(response);
  } catch (error) {
    next(error);
  }
};
