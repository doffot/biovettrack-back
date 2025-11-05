// src/routes/appointmentRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleInputErrors } from '../middleware/validation';
import { AppointmentController } from '../controllers/AppointmentController';
import { authenticate } from '../middleware/auth';

// Validaciones para crear cita
const createAppointmentValidation = [
  param('patientId').isMongoId().withMessage('ID de paciente inválido'),
  body('type')
    .notEmpty().withMessage('El tipo de cita es obligatorio')
    .isIn(['Consulta', 'Peluquería', 'Laboratorio', 'Vacuna', 'Cirugía', 'Tratamiento'])
    .withMessage('Tipo de cita no válido'),
  body('date')
    .notEmpty().withMessage('La fecha es obligatoria')
    .isISO8601().withMessage('Formato de fecha inválido'),
  body('reason')
    .notEmpty().withMessage('El motivo o detalle es obligatorio')
    .isString().withMessage('El motivo debe ser texto')
    .trim()
    .isLength({ max: 200 }).withMessage('El motivo no puede exceder 200 caracteres'),
  body('observations')
    .optional()
    .isString().withMessage('Las observaciones deben ser texto')
    .trim()
    .isLength({ max: 500 }).withMessage('Las observaciones no pueden exceder 500 caracteres'),
];

// ✅ Validación para actualizar estado
const updateStatusValidation = [
  param('id').isMongoId().withMessage('ID de cita inválido'),
  body('status')
    .notEmpty().withMessage('El estado es obligatorio')
    .isIn(['Programada', 'Completada', 'Cancelada', 'No asistió'])
    .withMessage('Estado de cita no válido'),
];

// Router anidado (para crear citas por paciente)
const patientAppointmentRouter = Router({ mergeParams: true });

// POST /api/patients/:patientId/appointments
patientAppointmentRouter.post(
  '/',
  authenticate,
  ...createAppointmentValidation,
  handleInputErrors,
  AppointmentController.createAppointment
);

// Exportar router anidado
export default patientAppointmentRouter;

// ✅ Router global (para operaciones que no dependen de patientId)
export const globalAppointmentRouter = Router();

// PATCH /api/appointments/:id/status
globalAppointmentRouter.patch(
  '/:id/status',
  authenticate,
  ...updateStatusValidation,
  handleInputErrors,
  AppointmentController.updateAppointmentStatus
);