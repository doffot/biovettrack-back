// src/routes/veterinaryServiceRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { VeterinaryServiceController } from "../controllers/VeterinaryServiceController";
import { checkCanCreate } from "../middleware/checkCanCreate";

const router = Router();

router.use(authenticate);

/* GET /api/veterinary-services/:id */
router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID de servicio inválido"),
  handleInputErrors,
  VeterinaryServiceController.getServiceById
);

/* POST /api/veterinary-services/:patientId */
router.post(
  "/:patientId",
  checkCanCreate,
  [
    param("patientId").isMongoId().withMessage("ID de paciente inválido"),
    
    body("serviceName")
      .notEmpty().withMessage("El nombre del servicio es obligatorio")
      .trim().isLength({ max: 150 }).withMessage("Máximo 150 caracteres"),
    
    body("serviceDate")
      .optional()
      .isISO8601().withMessage("Fecha inválida"),
    
    body("veterinarianFee")
      .notEmpty().withMessage("Los honorarios son obligatorios")
      .isFloat({ min: 0 }).withMessage("Los honorarios no pueden ser negativos"),
    
    body("discount")
      .optional()
      .isFloat({ min: 0 }).withMessage("El descuento no puede ser negativo"),
      
    body("products")
      .optional()
      .isArray().withMessage("Formato de productos inválido"),
    
    body("products.*.productName")
      .optional()
      .notEmpty().withMessage("El nombre del producto es obligatorio"),
      
    body("products.*.quantity")
      .optional()
      .isFloat({ min: 0.1 }).withMessage("La cantidad debe ser mayor a 0"),
      
    body("products.*.unitPrice")
      .optional()
      .isFloat({ min: 0 }).withMessage("El precio unitario no puede ser negativo"),

    body("products.*.productId")
      .optional()
      .isMongoId().withMessage("ID de producto de inventario inválido"),
      
    body("description")
      .optional()
      .isString()
      .trim().isLength({ max: 500 }).withMessage("Máximo 500 caracteres"),
  ],
  handleInputErrors,
  VeterinaryServiceController.createService
);

/* GET /api/veterinary-services/patient/:patientId */
router.get(
  "/patient/:patientId",
  param("patientId").isMongoId().withMessage("ID de paciente inválido"),
  handleInputErrors,
  VeterinaryServiceController.getServicesByPatient
);

/* DELETE /api/veterinary-services/:id */
router.delete(
  "/:id",
  checkCanCreate,
  param("id").isMongoId().withMessage("ID de servicio inválido"),
  handleInputErrors,
  VeterinaryServiceController.deleteService
);

export default router;