// src/routes/appointmentRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleInputErrors } from '../middleware/validation';
import { AppointmentController } from '../controllers/AppointmentController';
import { authenticate } from '../middleware/auth';

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

const updateStatusValidation = [
  param('id').isMongoId().withMessage('ID de cita inválido'),
  body('status')
    .notEmpty().withMessage('El estado es obligatorio')
    .isIn(['Programada', 'Completada', 'Cancelada', 'No asistió'])
    .withMessage('Estado de cita no válido'),
];

const patientAppointmentRouter = Router({ mergeParams: true });

patientAppointmentRouter.post(
  '/',
  authenticate,
  ...createAppointmentValidation,
  handleInputErrors,
  AppointmentController.createAppointment
);

patientAppointmentRouter.get(
  '/',
  authenticate,
  AppointmentController.getAppointmentsByPatient
);

export default patientAppointmentRouter;

export const globalAppointmentRouter = Router();

globalAppointmentRouter.get(
  '/',
  authenticate,
  AppointmentController.getAllAppointments
);

globalAppointmentRouter.get(
  '/date/:date',
  authenticate,
  AppointmentController.getAppointmentsByDateForVeterinarian
);

// globalAppointmentRouter.get(
//   '/:id/check-payments',
//   authenticate,
//   param('id').isMongoId().withMessage('ID de cita inválido'),
//   handleInputErrors,
//   AppointmentController.checkAppointmentPayments
// );

globalAppointmentRouter.get(
  '/:id',
  authenticate,
  param('id').isMongoId().withMessage('ID de cita inválido'),
  handleInputErrors,
  AppointmentController.getAppointmentById
);

globalAppointmentRouter.patch(
  '/:id/status',
  authenticate,
  ...updateStatusValidation,
  handleInputErrors,
  AppointmentController.updateAppointmentStatus
);

globalAppointmentRouter.delete(
  '/:id',
  authenticate,
  param('id').isMongoId().withMessage('ID de cita inválido'),
  handleInputErrors,
  AppointmentController.deleteAppointment
);

globalAppointmentRouter.patch(
  '/:id',
  authenticate,
  body('type')
    .notEmpty().withMessage('El tipo de cita es obligatorio')
    .isIn(['Consulta', 'Peluquería', 'Laboratorio', 'Vacuna', 'Cirugía', 'Tratamiento'])
    .withMessage('Tipo de cita no válido'),
  body('date')
    .notEmpty().withMessage('La fecha es obligatoria')
    .isISO8601().withMessage('Formato de fecha inválido'),
  body('reason')
    .notEmpty().withMessage('El motivo es obligatorio')
    .isString().withMessage('El motivo debe ser texto')
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('El motivo debe tener entre 2 y 200 caracteres'),
  body('observations')
    .optional()
    .isString().withMessage('Las observaciones deben ser texto')
    .trim()
    .isLength({ max: 500 }).withMessage('Las observaciones no pueden exceder 500 caracteres'),
  handleInputErrors,
  AppointmentController.updateAppointment
);