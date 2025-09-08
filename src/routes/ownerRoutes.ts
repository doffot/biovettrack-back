// src/routes/ownerRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleInputErrors } from '../middleware/validation';
import { OwnerController } from '../controllers/OwnerController';

const router = Router();

/**
 * Ruta: POST /api/owners
 * Crea un nuevo dueño
 */
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

router.get(
  '/',
  OwnerController.getAllOwners
);

/** por id */
router.get('/:id', 
    param('id').isMongoId().withMessage(' ID no válido'),
    handleInputErrors,
    OwnerController.getOwnerById
)

/**
 * Ruta: PUT /api/owners/:id
 * Actualiza un dueño existente
 */
router.put('/:id', 
    param('id').isMongoId().withMessage(' ID no válido'),
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
    OwnerController.updateOwner
)

router.delete(
  '/:id',
  param('id').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  OwnerController.deleteOwner
);

export default router;