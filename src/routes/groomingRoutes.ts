// routes/groomingRoutes.ts

import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleInputErrors } from '../middleware/validation';
import { GroomingServiceController } from '../controllers/GroomingServiceController';
import { authenticate } from '../middleware/auth';

// Validaciones (igual que antes)
const createGroomingValidation = [ /* ... */ ];
const updateGroomingValidation = [ /* ... */ ];

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
  param('id').isMongoId().withMessage('ID de servicio inválido'),
  handleInputErrors,
  GroomingServiceController.getGroomingServiceById
);

// PUT /api/grooming/:id
globalGroomingRouter.put(
  '/:id',
  param('id').isMongoId().withMessage('ID de servicio inválido'),
  ...updateGroomingValidation,
  handleInputErrors,
  GroomingServiceController.updateGroomingService
);

// DELETE /api/grooming/:id
globalGroomingRouter.delete(
  '/:id',
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
  param('patientId').isMongoId().withMessage('ID de paciente inválido'),
  ...createGroomingValidation,
  handleInputErrors,
  GroomingServiceController.createGroomingService
);

// GET /api/patients/:patientId/grooming
patientGroomingRouter.get(
  '/',
  
  param('patientId').isMongoId().withMessage('ID de paciente inválido'),
  handleInputErrors,
  GroomingServiceController.getGroomingServicesByPatient
);

// Exportar ambos
export { globalGroomingRouter, patientGroomingRouter };