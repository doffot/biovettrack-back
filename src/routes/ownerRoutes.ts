// src/routes/ownerRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleInputErrors } from '../middleware/validation';
import { OwnerController } from '../controllers/OwnerController';
import { PatientController } from '../controllers/PatientController';
import upload from '../middleware/upload';
import { patientValidation } from '../validation/patientValidation';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Crear dueño
router.post(
  '/',
  body('name')
    .notEmpty().withMessage('El nombre del dueño es obligatorio')
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('contact')
    .notEmpty().withMessage('El contacto (teléfono) es obligatorio')
    .isString().withMessage('El contacto debe ser texto')
    .matches(/^[\+]?[0-9\s\-\(\)]+$/)
    .withMessage('Por favor ingrese un número de contacto válido (ej: +54 9 11 1234-5678)'),

  body('email')
    .optional({ nullable: true })
    .isEmail().withMessage('Formato de email inválido')
    .normalizeEmail(),

  body('nationalId')
    .optional({ nullable: true })
    .isString().withMessage('El ID nacional debe ser texto')
    .trim()
    .isLength({ max: 20 }).withMessage('El ID nacional no puede exceder 20 caracteres'),
    

  body('address')
    .optional({ nullable: true })
    .isString().withMessage('La dirección debe ser texto')
    .trim()
    .isLength({ max: 200 }).withMessage('La dirección no puede exceder 200 caracteres'),

  handleInputErrors,
  OwnerController.createOwner
);

// Listar todos los dueños
router.get('/', OwnerController.getAllOwners);

// Obtener dueño por ID
router.get(
  '/:id',
  param('id').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  OwnerController.getOwnerById
);

// Actualizar dueño
router.put(
  '/:id',
  param('id').isMongoId().withMessage('ID no válido'),

  body('name')
    .optional()
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('contact')
    .optional()
    .isString().withMessage('El contacto debe ser texto')
    .matches(/^[\+]?[0-9\s\-\(\)]+$/)
    .withMessage('Por favor ingrese un número de contacto válido'),

  body('email')
    .optional({ nullable: true })
    .isEmail().withMessage('Formato de email inválido')
    .normalizeEmail(),

  body('nationalId')
    .optional({ nullable: true })
    .isString().withMessage('El ID nacional debe ser texto')
    .trim()
    .isLength({ max: 20 }).withMessage('El ID nacional no puede exceder 20 caracteres'),

  body('address')
    .optional({ nullable: true })
    .isString().withMessage('La dirección debe ser texto')
    .trim()
    .isLength({ max: 200 }).withMessage('La dirección no puede exceder 200 caracteres'),

  handleInputErrors,
  OwnerController.updateOwner
);

// Eliminar dueño
router.delete(
  '/:id',
  param('id').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  OwnerController.deleteOwner
);

// ✅ CREAR PACIENTE ASOCIADO A UN DUEÑO
router.post(
  '/:ownerId/patients',
  param('ownerId').isMongoId().withMessage('ID de dueño inválido'),
  upload.single('photo'),
  ...patientValidation,
  handleInputErrors,
  PatientController.createPatient
);

// GET /owners/:id/appointments - Obtener citas activas del owner
router.get(
  '/:id/appointments',
  authenticate,
  param('id').isMongoId().withMessage('ID de dueño inválido'),
  handleInputErrors,
  OwnerController.getOwnerAppointments
);

// GET /owners/:id/grooming-services
router.get(
  '/:id/grooming-services',
  authenticate,
  param('id').isMongoId().withMessage('ID de dueño inválido'),
  handleInputErrors,
  OwnerController.getOwnerGroomingServices
);

export default router;