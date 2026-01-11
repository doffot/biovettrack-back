// src/routes/inventoryRoutes.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { InventoryController } from "../controllers/InventoryController";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";

const router = Router();
router.use(authenticate);

// Inicializar inventario para un producto (opcional, podría hacerse al crear producto)
router.post(
  "/initialize",
  [
    body("productId").isMongoId().withMessage("ID de producto inválido"),
    body("stockUnits").optional().isFloat({ min: 0 }).withMessage("Stock de unidades inválido"),
    body("stockDoses").optional().isFloat({ min: 0 }).withMessage("Stock de dosis inválido"),
  ],
  handleInputErrors,
  InventoryController.initializeInventory
);

// Consumir stock
router.post(
  "/:productId/consume",
  [
    param("productId").isMongoId().withMessage("ID de producto inválido"),
    body("quantity").isFloat({ min: 0.01 }).withMessage("Cantidad inválida"),
    body("isFullUnit").optional().isBoolean().withMessage("isFullUnit debe ser booleano"),
    body("reason").optional().isString().withMessage("Razón inválida"),
    body("referenceType").optional().isString().withMessage("Tipo de referencia inválido"),
    body("referenceId").optional().isMongoId().withMessage("ID de referencia inválido"),
  ],
  handleInputErrors,
  InventoryController.consumeStock
);

// Obtener inventario
router.get("/:productId", 
  param("productId").isMongoId().withMessage("ID de producto inválido"),
  handleInputErrors,
  InventoryController.getInventory
);

// Productos con stock bajo
router.get("/low-stock", InventoryController.getLowStockProducts);

export default router;