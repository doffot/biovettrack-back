// routes/groomingRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleInputErrors } from '../middleware/validation';
import { GroomingServiceController } from '../controllers/GroomingServiceController';
import { authenticate } from '../middleware/auth';

// Validaciones para CREAR servicio
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

  body('paymentMethod')
    .isMongoId().withMessage('ID de método de pago inválido'),

  body('paymentReference')
    .optional()
    .isString().withMessage('La referencia debe ser texto')
    .trim(),

  body('status')
    .optional()
    .isIn(['Programado', 'En progreso', 'Completado', 'Cancelado'])
    .withMessage('Estado no válido'),

  body('paymentStatus')
    .optional()
    .isIn(['Pendiente', 'Pagado', 'Parcial', 'Cancelado'])
    .withMessage('Estado de pago no válido'),

  body('amountPaid')
    .optional()
    .isFloat({ min: 0 }).withMessage('El monto pagado debe ser positivo'),

  body('date')
    .optional()
    .isISO8601().withMessage('Fecha inválida')
];

// Validaciones para ACTUALIZAR servicio
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

  body('paymentMethod')
    .optional()
    .isMongoId().withMessage('ID de método de pago inválido'),

  body('paymentReference')
    .optional()
    .isString().withMessage('La referencia debe ser texto')
    .trim(),

  body('status')
    .optional()
    .isIn(['Programado', 'En progreso', 'Completado', 'Cancelado'])
    .withMessage('Estado no válido'),

  body('paymentStatus')
    .optional()
    .isIn(['Pendiente', 'Pagado', 'Parcial', 'Cancelado'])
    .withMessage('Estado de pago no válido'),

  body('amountPaid')
    .optional()
    .isFloat({ min: 0 }).withMessage('El monto pagado debe ser positivo'),

  body('date')
    .optional()
    .isISO8601().withMessage('Fecha inválida')
];

// ================================
// 🌐 Router GLOBAL (sin patientId)
// ================================
const globalGroomingRouter = Router();

// GET /api/grooming → todos los servicios
globalGroomingRouter.get(
  '/',
  authenticate,
  GroomingServiceController.getAllGroomingServices
);

// GET /api/grooming/:id
globalGroomingRouter.get(
  '/:id',
  authenticate,
  param('id').isMongoId().withMessage('ID de servicio inválido'),
  handleInputErrors,
  GroomingServiceController.getGroomingServiceById
);

// PUT /api/grooming/:id
globalGroomingRouter.put(
  '/:id',
  authenticate,
  param('id').isMongoId().withMessage('ID de servicio inválido'),
  ...updateGroomingValidation,
  handleInputErrors,
  GroomingServiceController.updateGroomingService
);

// DELETE /api/grooming/:id
globalGroomingRouter.delete(
  '/:id',
  authenticate,
  param('id').isMongoId().withMessage('ID de servicio inválido'),
  handleInputErrors,
  GroomingServiceController.deleteGroomingService
);

// ====================================
// 👥 Router ANIDADO (con patientId)
// ====================================
const patientGroomingRouter = Router({ mergeParams: true });

// POST /api/patients/:patientId/grooming
patientGroomingRouter.post(
  '/',
  authenticate,
  param('patientId').isMongoId().withMessage('ID de paciente inválido'),
  ...createGroomingValidation,
  handleInputErrors,
  GroomingServiceController.createGroomingService
);

// GET /api/patients/:patientId/grooming
patientGroomingRouter.get(
  '/',
  authenticate,
  param('patientId').isMongoId().withMessage('ID de paciente inválido'),
  handleInputErrors,
  GroomingServiceController.getGroomingServicesByPatient
);

// Exportar ambos
export { globalGroomingRouter, patientGroomingRouter };