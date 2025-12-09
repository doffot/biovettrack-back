// src/routes/invoiceRoutes.ts
import { Router } from "express";
import { body, param, query } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { InvoiceController } from "../controllers/InvoiceController";
import { authenticate } from "../middleware/auth";

const createInvoiceValidation = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("La factura debe tener al menos un ítem"),
  body("items.*.type")
    .isIn(["grooming", "labExam", "consulta", "vacuna", "producto"])
    .withMessage("Tipo de ítem no válido"),
  body("items.*.resourceId")
    .isMongoId()
    .withMessage("ID del recurso inválido"),
  body("items.*.description")
    .notEmpty()
    .withMessage("La descripción es obligatoria")
    .isString()
    .withMessage("La descripción debe ser texto")
    .trim()
    .isLength({ max: 200 })
    .withMessage("Máximo 200 caracteres"),
  body("items.*.cost")
    .isFloat({ min: 0 })
    .withMessage("El costo debe ser un número positivo"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("La cantidad debe ser un número entero positivo"),

  body("ownerId")
    .optional()
    .isMongoId()
    .withMessage("ID de dueño inválido"),
  body("ownerName")
    .optional()
    .isString()
    .withMessage("El nombre del dueño debe ser texto")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Máximo 100 caracteres"),
  body("ownerPhone")
    .optional()
    .isString()
    .withMessage("El teléfono del dueño debe ser texto")
    .trim()
    .isLength({ max: 20 })
    .withMessage("Máximo 20 caracteres"),

  body("patientId")
    .optional()
    .isMongoId()
    .withMessage("ID de paciente inválido"),
  body("total")
    .isFloat({ min: 0 })
    .withMessage("El total debe ser un número positivo"),
  body("amountPaid")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El monto pagado debe ser un número positivo"),
  body("amountPaidUSD")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El monto en USD debe ser un número positivo"),
  body("amountPaidBs")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El monto en Bs debe ser un número positivo"),
  body("paymentStatus")
    .optional()
    .isIn(["Pendiente", "Pagado", "Parcial", "Cancelado"])
    .withMessage("Estado de pago no válido"),
  body("paymentMethod")
    .optional()
    .isMongoId()
    .withMessage("ID de método de pago inválido"),
  body("paymentReference")
    .optional()
    .isString()
    .withMessage("La referencia debe ser texto")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Máximo 100 caracteres"),
  body("currency")
    .optional()
    .isIn(["USD", "Bs"])
    .withMessage("La moneda debe ser USD o Bs"),
  body("exchangeRate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("La tasa de cambio debe ser un número positivo"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Fecha inválida"),
];

// Validaciones para actualizar factura
const updateInvoiceValidation = [
  body("items")
    .optional()
    .isArray({ min: 1 })
    .withMessage("La factura debe tener al menos un ítem"),
  body("total")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El total debe ser un número positivo"),
  body("amountPaid")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El monto pagado debe ser un número positivo"),
  body("amountPaidUSD")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El monto en USD debe ser un número positivo"),
  body("amountPaidBs")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El monto en Bs debe ser un número positivo"),
  body("paymentStatus")
    .optional()
    .isIn(["Pendiente", "Pagado", "Parcial", "Cancelado"])
    .withMessage("Estado de pago no válido"),
  body("paymentMethod")
    .optional()
    .isMongoId()
    .withMessage("ID de método de pago inválido"),
  body("paymentReference")
    .optional()
    .isString()
    .withMessage("La referencia debe ser texto")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Máximo 100 caracteres"),
  body("exchangeRate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("La tasa de cambio debe ser un número positivo"),
  body("currency")
    .optional()
    .isIn(["USD", "Bs"])
    .withMessage("La moneda debe ser USD o Bs"),
];

const updateInvoiceItemValidation = [
  param("id")
    .isMongoId()
    .withMessage("ID de factura inválido"),
  param("resourceId")
    .isMongoId()
    .withMessage("ID de recurso inválido"),
  body("cost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El costo debe ser un número positivo"),
  body("description")
    .optional()
    .isString()
    .withMessage("La descripción debe ser texto")
    .trim()
    .isLength({ max: 200 })
    .withMessage("Máximo 200 caracteres"),
  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La cantidad debe ser un número entero positivo"),
];

const getByResourceIdValidation = [
  param("resourceId")
    .isMongoId()
    .withMessage("ID de recurso inválido"),
  query("type")
    .optional()
    .isIn(["grooming", "labExam", "consulta", "vacuna", "producto"])
    .withMessage("Tipo de recurso no válido"),
];

// Validaciones para filtros de lista
const listInvoicesValidation = [
  query("status")
    .optional()
    .isIn(["Pendiente", "Pagado", "Parcial", "Cancelado"])
    .withMessage("Estado de pago no válido"),
  query("ownerId")
    .optional()
    .isMongoId()
    .withMessage("ID de dueño inválido"),
  query("ownerName")
    .optional()
    .isString()
    .withMessage("El nombre del dueño debe ser texto")
    .trim(),
  query("patientId")
    .optional()
    .isMongoId()
    .withMessage("ID de paciente inválido"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero positivo"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe estar entre 1 y 100"),
];

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticate);

router.post(
  "/",
  ...createInvoiceValidation,
  handleInputErrors,
  InvoiceController.createInvoice
);

router.get(
  "/",
  ...listInvoicesValidation,
  handleInputErrors,
  InvoiceController.getInvoices
);

router.get(
  "/resource/:resourceId",
  ...getByResourceIdValidation,
  handleInputErrors,
  InvoiceController.getInvoiceByResourceId
);

router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID de factura inválido"),
  handleInputErrors,
  InvoiceController.getInvoiceById
);

router.put(
  "/:id",
  param("id").isMongoId().withMessage("ID de factura inválido"),
  ...updateInvoiceValidation,
  handleInputErrors,
  InvoiceController.updateInvoice
);

router.put(
  "/:id/item/:resourceId",
  ...updateInvoiceItemValidation,
  handleInputErrors,
  InvoiceController.updateInvoiceItem
);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage("ID de factura inválido"),
  handleInputErrors,
  InvoiceController.deleteInvoice
);

export default router;