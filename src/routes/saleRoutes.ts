// src/routes/saleRoutes.ts
import { Router } from "express";
import { body, param, query } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { SaleController } from "../controllers/SaleController";

const router = Router();

router.use(authenticate);

// ==================== RUTAS DE CONSULTA ====================

// Obtener resumen del día
router.get("/today", SaleController.getTodaySummary);

// Obtener resumen por rango de fechas
router.get(
  "/summary",
  [
    query("startDate").isISO8601().withMessage("Fecha de inicio inválida"),
    query("endDate").isISO8601().withMessage("Fecha de fin inválida"),
  ],
  handleInputErrors,
  SaleController.getSalesSummary
);

// Obtener todas las ventas (con filtros)
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Página inválida"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Límite inválido"),
    query("status").optional().isIn(["completada", "pendiente", "cancelada"]).withMessage("Estado inválido"),
    query("isPaid").optional().isBoolean().withMessage("isPaid debe ser booleano"),
    query("startDate").optional().isISO8601().withMessage("Fecha de inicio inválida"),
    query("endDate").optional().isISO8601().withMessage("Fecha de fin inválida"),
  ],
  handleInputErrors,
  SaleController.getSales
);

// Obtener venta por ID
router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID de venta inválido"),
  handleInputErrors,
  SaleController.getSaleById
);

// ==================== VALIDACIÓN ====================

// Validar stock antes de vender
router.post(
  "/validate-stock",
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("Debe incluir al menos un producto"),
    body("items.*.productId")
      .isMongoId()
      .withMessage("ID de producto inválido"),
    body("items.*.quantity")
      .isFloat({ min: 0.01 })
      .withMessage("Cantidad inválida"),
    body("items.*.isFullUnit")
      .optional()
      .isBoolean()
      .withMessage("isFullUnit debe ser booleano"),
  ],
  handleInputErrors,
  SaleController.validateStock
);

// ==================== CREAR VENTA ====================

router.post(
  "/",
  [
    // Cliente (opcional)
    body("ownerId")
      .optional()
      .isMongoId()
      .withMessage("ID de cliente inválido"),
    body("ownerName")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Nombre muy largo"),
    body("ownerPhone")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 20 })
      .withMessage("Teléfono muy largo"),
    
    // Paciente (opcional)
    body("patientId")
      .optional()
      .isMongoId()
      .withMessage("ID de paciente inválido"),
    
    // Items (obligatorio)
    body("items")
      .isArray({ min: 1 })
      .withMessage("Debe incluir al menos un producto"),
    body("items.*.productId")
      .isMongoId()
      .withMessage("ID de producto inválido"),
    body("items.*.quantity")
      .isFloat({ min: 0.01 })
      .withMessage("Cantidad debe ser mayor a 0"),
    body("items.*.isFullUnit")
      .optional()
      .isBoolean()
      .withMessage("isFullUnit debe ser booleano"),
    body("items.*.discount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Descuento inválido"),
    
    // Totales
    body("discountTotal")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Descuento total inválido"),
    
    // Pago
    body("amountPaidUSD")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Monto USD inválido"),
    body("amountPaidBs")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Monto Bs inválido"),
    body("creditUsed")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Crédito inválido"),
    body("exchangeRate")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("Tasa de cambio inválida"),
    
    // Notas
    body("notes")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Notas muy largas"),
  ],
  handleInputErrors,
  SaleController.createSale
);

// ==================== CANCELAR VENTA ====================

router.patch(
  "/:id/cancel",
  [
    param("id").isMongoId().withMessage("ID de venta inválido"),
    body("reason")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Razón muy larga"),
  ],
  handleInputErrors,
  SaleController.cancelSale
);

export default router;