import { Router } from 'express';
import { checkSchema } from 'express-validator';

import { createPatientController } from '../controllers/createPatient.controller.js';
import { createPatientSchema } from '../validators/createPatient.validator.js';

/**
 * Returns the router where every endpoint of the service is mounted
 */
export const createRouter = (): Router => {
  const router = Router();
  router.post('/patients', checkSchema(createPatientSchema), createPatientController);
  return router;
};
