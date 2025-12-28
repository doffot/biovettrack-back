// src/routes/paymentRoutes.ts
import { Router } from "express";
import { body, param, query } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { PaymentController } from "../controllers/PaymentController";
import { authenticate } from "../middleware/auth";

// Validaciones para crear pago
const createPaymentValidation = [
  body("invoiceId")
    .isMongoId()
    .withMessage("ID de factura inválido"),
  body("amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El monto debe ser mayor o igual a 0"),
  body("currency")
    .isIn(["USD", "Bs"])
    .withMessage("La moneda debe ser USD o Bs"),
  body("exchangeRate")
    .isFloat({ min: 0.01 })
    .withMessage("La tasa de cambio debe ser mayor a 0"),
  body("paymentMethod")
    .optional()
    .isMongoId()
    .withMessage("ID de método de pago inválido"),
  body("reference")
    .optional()
    .isString()
    .withMessage("La referencia debe ser texto")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Máximo 100 caracteres"),
  body("creditAmountUsed")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El crédito debe ser mayor o igual a 0"),
  // Validación personalizada: debe haber amount o creditAmountUsed
  body().custom((value, { req }) => {
    const amount = req.body.amount || 0;
    const credit = req.body.creditAmountUsed || 0;
    if (amount <= 0 && credit <= 0) {
      throw new Error("Debe especificar un monto o crédito a usar");
    }
    // Si hay amount > 0, debe haber paymentMethod
    if (amount > 0 && !req.body.paymentMethod) {
      throw new Error("Debe seleccionar un método de pago");
    }
    return true;
  }),
];

// Validaciones para listar pagos
const listPaymentsValidation = [
  query("status")
    .optional()
    .isIn(["active", "cancelled"])
    .withMessage("Estado inválido"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Fecha de inicio inválida"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Fecha de fin inválida"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero positivo"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe estar entre 1 y 100"),
];

// Validaciones para obtener pagos de una factura
const getByInvoiceValidation = [
  param("invoiceId")
    .isMongoId()
    .withMessage("ID de factura inválido"),
];

// Validaciones para cancelar pago
const cancelPaymentValidation = [
  param("paymentId")
    .isMongoId()
    .withMessage("ID de pago inválido"),
  body("reason")
    .optional()
    .isString()
    .withMessage("La razón debe ser texto")
    .trim()
    .isLength({ max: 200 })
    .withMessage("Máximo 200 caracteres"),
];

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// Crear pago
router.post(
  "/",
  ...createPaymentValidation,
  handleInputErrors,
  PaymentController.createPayment
);

// Obtener mis pagos (con filtros)
router.get(
  "/",
  ...listPaymentsValidation,
  handleInputErrors,
  PaymentController.getMyPayments
);

// Obtener pagos de una factura específica
router.get(
  "/invoice/:invoiceId",
  ...getByInvoiceValidation,
  handleInputErrors,
  PaymentController.getPaymentsByInvoice
);

// Cancelar/anular pago
router.patch(
  "/:paymentId/cancel",
  ...cancelPaymentValidation,
  handleInputErrors,
  PaymentController.cancelPayment
);

export default router;