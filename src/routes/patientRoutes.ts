// src/routes/patientRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleInputErrors } from '../middleware/validation';
import { PatientController } from '../controllers/PatientController';
import upload from '../middleware/upload';
import { authenticate } from '../middleware/auth';
import { checkCanCreate } from '../middleware/checkCanCreate';

const router = Router();

// Validaciones opcionales para actualización
const optionalPatientValidation = [
  body('name')
    .optional()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isString().withMessage('El nombre debe ser texto')
    .trim(),

  body('birthDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('La fecha debe tener el formato YYYY-MM-DD')
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      const isValid = !isNaN(date.getTime());
      const isPast = date <= new Date();
      if (!isValid) throw new Error('Fecha inválida');
      if (!isPast) throw new Error('La fecha no puede ser futura');
      return true;
    }),

  body('sex')
    .optional()
    .isIn(['Macho', 'Hembra']).withMessage('Sexo no válido'),

  body('species')
    .optional()
    .isIn([
      'Canino',
      'Felino',
      'Conejo',
      'Ave',
      'Reptil',
      'Roedor',
      'Hurón',
      'Otro'
    ]).withMessage('Especie no válida'),

  body('breed')
    .optional()
    .isString().withMessage('La raza debe ser texto')
    .trim(),

  body('weight')
    .optional()
    .isFloat({ min: 0 }).withMessage('El peso debe ser positivo'),

  body('color') 
    .optional()
    .isString().withMessage('El color debe ser texto')
    .trim(),

  body('identification') 
    .optional()
    .isString().withMessage('La identificación debe ser texto')
    .trim(),

  body('owner')
    .optional()
    .isMongoId().withMessage('ID de dueño no válido'),

  body('mainVet')
    .optional()
    .isMongoId().withMessage('ID de veterinario no válido'), 

  body('referringVet')
    .optional()
    .isString().withMessage('El veterinario referido debe ser texto')
    .trim(),
];

// Obtener paciente por ID
router.get(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  handleInputErrors,
  PatientController.getPatientById
);

// Actualizar paciente
router.put(
  '/:id',
  checkCanCreate,
  param('id').isMongoId().withMessage('ID inválido'),
  upload.single('photo'),
  ...optionalPatientValidation,
  handleInputErrors,
  PatientController.updatePatient
);

// Eliminar paciente
router.delete(
  '/:id',
  checkCanCreate,
  param('id').isMongoId().withMessage('ID inválido'),
  handleInputErrors,
  PatientController.deletePatient
);

// Obtener pacientes por dueño
router.get(
  '/owner/:ownerId',
  param('ownerId').isMongoId().withMessage('ID de dueño inválido'),
  handleInputErrors,
  PatientController.getPatientsByOwner
);

// Listar todos los pacientes
router.get('/', 
  authenticate,
  PatientController.getAllPatient);

export default router;