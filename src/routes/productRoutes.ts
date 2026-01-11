// src/routes/productRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { ProductController } from "../controllers/ProductController";

const router = Router();

router.use(authenticate);

// ==================== RUTAS DE CONSULTA ====================

router.get("/", ProductController.getAllProducts);
router.get("/active", ProductController.getActiveProducts);
// Nueva ruta para obtener productos con inventario
router.get("/with-inventory", ProductController.getProductsWithInventory);
router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID de producto inválido"),
  handleInputErrors,
  ProductController.getProductById
);

// ==================== RUTAS DE CREACIÓN/EDICIÓN ====================

router.post(
  "/",
  [
    body("name")
      .notEmpty().withMessage("El nombre es obligatorio")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("category")
      .isIn(["vacuna", "desparasitante", "medicamento", "alimento", "accesorio", "otro"])
      .withMessage("Categoría inválida"),
    body("salePrice")
      .isFloat({ min: 0 }).withMessage("Precio de venta inválido"),
    body("salePricePerDose")
      .optional()
      .isFloat({ min: 0 }).withMessage("Precio por dosis inválido"),
    body("costPrice")
      .optional()
      .isFloat({ min: 0 }).withMessage("Costo inválido"),
    body("unit")
      .notEmpty().withMessage("La unidad física es obligatoria")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 30 }).withMessage("Máximo 30 caracteres"),
    body("doseUnit")
      .notEmpty().withMessage("La unidad de dosis es obligatoria")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 10 }).withMessage("Máximo 10 caracteres"),
    body("dosesPerUnit")
      .isFloat({ min: 1 }).withMessage("Las dosis por unidad deben ser al menos 1"),
    body("divisible")
      .optional()
      .isBoolean().withMessage("Divisible debe ser booleano"),
    body("description")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 200 }).withMessage("Máximo 200 caracteres"),
    body("active")
      .optional()
      .isBoolean().withMessage("Debe ser booleano"),
  ],
  handleInputErrors,
  ProductController.createProduct
);

router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("ID de producto inválido"),
    body("name")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("category")
      .optional()
      .isIn(["vacuna", "desparasitante", "medicamento", "alimento", "accesorio", "otro"])
      .withMessage("Categoría inválida"),
    body("salePrice")
      .optional()
      .isFloat({ min: 0 }).withMessage("Precio de venta inválido"),
    body("salePricePerDose")
      .optional()
      .isFloat({ min: 0 }).withMessage("Precio por dosis inválido"),
    body("costPrice")
      .optional()
      .isFloat({ min: 0 }).withMessage("Costo inválido"),
    body("unit")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 30 }).withMessage("Máximo 30 caracteres"),
    body("doseUnit")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 10 }).withMessage("Máximo 10 caracteres"),
    body("dosesPerUnit")
      .optional()
      .isFloat({ min: 1 }).withMessage("Las dosis por unidad deben ser al menos 1"),
    body("divisible")
      .optional()
      .isBoolean().withMessage("Divisible debe ser booleano"),
    body("description")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 200 }).withMessage("Máximo 200 caracteres"),
    body("active")
      .optional()
      .isBoolean().withMessage("Debe ser booleano"),
  ],
  handleInputErrors,
  ProductController.updateProduct
);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage("ID de producto inválido"),
  handleInputErrors,
  ProductController.deleteProduct
);

export default router;