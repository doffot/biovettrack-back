// src/routes/paymentMethodRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleInputErrors } from '../middleware/validation';
import { PaymentMethodController } from '../controllers/PaymentMethodController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Validaciones para crear y actualizar
const paymentMethodValidation = [
  body('name')
    .notEmpty().withMessage('El nombre del método de pago es obligatorio')
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ max: 50 }).withMessage('El nombre no puede exceder 50 caracteres'),

  body('description')
    .optional()
    .isString().withMessage('La descripción debe ser texto')
    .trim()
    .isLength({ max: 200 }).withMessage('La descripción no puede exceder 200 caracteres'),

  body('currency')
    .notEmpty().withMessage('La moneda es obligatoria')
    .isString().withMessage('La moneda debe ser texto')
    .trim()
    .isLength({ max: 20 }).withMessage('La moneda no puede exceder 20 caracteres'),

  body('paymentMode')
    .notEmpty().withMessage('El modo de pago es obligatorio')
    .isString().withMessage('El modo de pago debe ser texto')
    .trim()
    .isLength({ max: 30 }).withMessage('El modo de pago no puede exceder 30 caracteres'),

  body('requiresReference')
    .optional()
    .isBoolean().withMessage('requiresReference debe ser verdadero o falso')
];

// Validaciones opcionales para actualización
const optionalPaymentMethodValidation = [
  body('name')
    .optional()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ max: 50 }).withMessage('El nombre no puede exceder 50 caracteres'),

  body('description')
    .optional()
    .isString().withMessage('La descripción debe ser texto')
    .trim()
    .isLength({ max: 200 }).withMessage('La descripción no puede exceder 200 caracteres'),

  body('currency')
    .optional()
    .notEmpty().withMessage('La moneda no puede estar vacía')
    .isString().withMessage('La moneda debe ser texto')
    .trim()
    .isLength({ max: 20 }).withMessage('La moneda no puede exceder 20 caracteres'),

  body('paymentMode')
    .optional()
    .notEmpty().withMessage('El modo de pago no puede estar vacío')
    .isString().withMessage('El modo de pago debe ser texto')
    .trim()
    .isLength({ max: 30 }).withMessage('El modo de pago no puede exceder 30 caracteres'),

  body('requiresReference')
    .optional()
    .isBoolean().withMessage('requiresReference debe ser verdadero o falso'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive debe ser verdadero o falso')
];

// ✅ Obtener todos los métodos de pago del veterinario autenticado
router.get(
  '/',
  authenticate,
  PaymentMethodController.getPaymentMethods
);

// ✅ Obtener método de pago por ID
router.get(
  '/:id',
  authenticate,
  param('id').isMongoId().withMessage('ID de método de pago inválido'),
  handleInputErrors,
  PaymentMethodController.getPaymentMethodById
);

// ✅ Crear método de pago
router.post(
  '/',
  authenticate,
  ...paymentMethodValidation,
  handleInputErrors,
  PaymentMethodController.createPaymentMethod
);

// ✅ Actualizar método de pago
router.put(
  '/:id',
  authenticate,
  param('id').isMongoId().withMessage('ID de método de pago inválido'),
  ...optionalPaymentMethodValidation,
  handleInputErrors,
  PaymentMethodController.updatePaymentMethod
);

// ✅ Eliminar (desactivar) método de pago
router.delete(
  '/:id',
  authenticate,
  param('id').isMongoId().withMessage('ID de método de pago inválido'),
  handleInputErrors,
  PaymentMethodController.deletePaymentMethod
);

export default router;