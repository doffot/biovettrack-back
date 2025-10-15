// src/routes/ownerRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleInputErrors } from '../middleware/validation';
import { OwnerController } from '../controllers/OwnerController';
import { PatientController } from '../controllers/PatientController';
import upload from '../middleware/upload';
import { patientValidation } from '../validation/patientValidation';

const router = Router();

// Crear dueño
router.post(
  '/',
  body('name')
    .notEmpty().withMessage('El nombre del dueño es obligatorio')
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres')
    .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),

  body('contact')
    .notEmpty().withMessage('El contacto (teléfono) es obligatorio')
    .isString().withMessage('El contacto debe ser texto')
    .matches(/^[\+]?[0-9\s\-\(\)]+$/)
    .withMessage('Por favor ingrese un número de contacto válido (ej: +54 9 11 1234-5678)'),

  body('email')
    .optional()
    .isEmail().withMessage('Formato de email inválido')
    .normalizeEmail(),

  body('address')
    .optional()
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
    .notEmpty().withMessage('El nombre del dueño es obligatorio')
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres')
    .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),

  body('contact')
    .notEmpty().withMessage('El contacto (teléfono) es obligatorio')
    .isString().withMessage('El contacto debe ser texto')
    .matches(/^[\+]?[0-9\s\-\(\)]+$/)
    .withMessage('Por favor ingrese un número de contacto válido'),

  body('email')
    .optional()
    .isEmail().withMessage('Formato de email inválido')
    .normalizeEmail(),

  body('address')
    .optional()
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

export default router;