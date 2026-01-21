// src/routes/groomingRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleInputErrors } from '../middleware/validation';
import { GroomingServiceController } from '../controllers/GroomingServiceController';
import { authenticate } from '../middleware/auth';
import { checkCanCreate } from '../middleware/checkCanCreate';

const createGroomingValidation = [
  body('service')
    .isIn(['Corte', 'Baño', 'Corte y Baño'])
    .withMessage('Tipo de servicio no válido'),

  body('specifications')
    .notEmpty().withMessage('Las especificaciones son obligatorias')
    .isString().withMessage('Las especificaciones deben ser texto')
    .trim()
    .isLength({ max: 300 }).withMessage('Máximo 300 caracteres'),

  body('observations')
    .optional()
    .isString().withMessage('Las observaciones deben ser texto')
    .trim()
    .isLength({ max: 500 }).withMessage('Máximo 500 caracteres'),

  body('cost')
    .isFloat({ min: 0 }).withMessage('El costo debe ser un número positivo'),

  body('date')
    .optional()
    .isISO8601().withMessage('Fecha inválida')
];

const updateGroomingValidation = [
  body('service')
    .optional()
    .isIn(['Corte', 'Baño', 'Corte y Baño'])
    .withMessage('Tipo de servicio no válido'),

  body('specifications')
    .optional()
    .isString().withMessage('Las especificaciones deben ser texto')
    .trim()
    .isLength({ max: 300 }).withMessage('Máximo 300 caracteres'),

  body('observations')
    .optional()
    .isString().withMessage('Las observaciones deben ser texto')
    .trim()
    .isLength({ max: 500 }).withMessage('Máximo 500 caracteres'),

  body('cost')
    .optional()
    .isFloat({ min: 0 }).withMessage('El costo debe ser un número positivo'),

  body('date')
    .optional()
    .isISO8601().withMessage('Fecha inválida')
];

const globalGroomingRouter = Router();

globalGroomingRouter.get('/', authenticate, GroomingServiceController.getAllGroomingServices);

globalGroomingRouter.get(
  '/:id',
  authenticate,
  param('id').isMongoId().withMessage('ID de servicio inválido'),
  handleInputErrors,
  GroomingServiceController.getGroomingServiceById
);

globalGroomingRouter.put(
  '/:id',
  authenticate,
  checkCanCreate,
  param('id').isMongoId().withMessage('ID de servicio inválido'),
  ...updateGroomingValidation,
  handleInputErrors,
  GroomingServiceController.updateGroomingService
);

globalGroomingRouter.delete(
  '/:id',
  authenticate,
  checkCanCreate,
  param('id').isMongoId().withMessage('ID de servicio inválido'),
  handleInputErrors,
  GroomingServiceController.deleteGroomingService
);

const patientGroomingRouter = Router({ mergeParams: true });

patientGroomingRouter.post(
  '/',
  authenticate,
  checkCanCreate,
  param('patientId').isMongoId().withMessage('ID de paciente inválido'),
  ...createGroomingValidation,
  handleInputErrors,
  GroomingServiceController.createGroomingService
);

patientGroomingRouter.get(
  '/',
  authenticate,
  param('patientId').isMongoId().withMessage('ID de paciente inválido'),
  handleInputErrors,
  GroomingServiceController.getGroomingServicesByPatient
);

export { globalGroomingRouter, patientGroomingRouter };