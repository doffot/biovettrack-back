// src/routes/purchaseRoutes.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { PurchaseController } from "../controllers/PurchaseController";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { checkCanCreate } from "../middleware/checkCanCreate";

const router = Router();
router.use(authenticate);

// Crear compra
router.post(
  "/",
  checkCanCreate,
  [
    body("items").isArray({ min: 1 }).withMessage("Debe incluir al menos un producto"),
    body("items.*.productId").isMongoId().withMessage("ID de producto inválido"),
    body("items.*.quantity").isFloat({ min: 0.01 }).withMessage("Cantidad inválida"),
    body("items.*.unitCost").isFloat({ min: 0 }).withMessage("Costo inválido"),
    body("paymentMethod").isString().notEmpty().withMessage("Método de pago requerido"),
    body("provider").optional().isString().trim(),
    body("notes").optional().isString().trim().isLength({ max: 200 }),
  ],
  handleInputErrors,
  PurchaseController.createPurchase
);

// Obtener todas las compras
router.get("/", PurchaseController.getAllPurchases);

// Obtener una compra por ID
router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID de compra inválido"),
  handleInputErrors,
  PurchaseController.getPurchaseById
);

export default router;