// src/routes/medicalOrderRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { MedicalOrderController } from "../controllers/MedicalOrderController";
import { checkCanCreate } from "../middleware/checkCanCreate";

const router = Router();

router.use(authenticate);

/* GET /api/medical-orders - Todas las órdenes del veterinario */
router.get("/", MedicalOrderController.getAllMedicalOrders);

/* POST /api/medical-orders/:patientId - Crear orden médica */
router.post(
  "/:patientId",
  checkCanCreate,
  [
    param("patientId").isMongoId().withMessage("ID de paciente inválido"),
    body("issueDate").optional().isISO8601().withMessage("Fecha inválida"),
    
    // Validamos que las categorías, si se envían, sean arrays
    body([
      "hematology",
      "coprology",
      "urinalysis",
      "cytology",
      "hormonal",
      "skin",
      "chemistry",
      "cultures",
      "antigenicTests"
    ]).optional().isArray().withMessage("Debe ser un listado de opciones (array)"),

    body("specialExams")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim(),
      
    body("observations")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim()
      .isLength({ max: 500 }).withMessage("Máximo 500 caracteres"),

    body("status")
      .optional()
      .isIn(["pending", "completed", "cancelled"]).withMessage("Estado no válido"),
  ],
  handleInputErrors,
  MedicalOrderController.createMedicalOrder
);

/* GET /api/medical-orders/patient/:patientId - Órdenes de un paciente */
router.get(
  "/patient/:patientId",
  param("patientId").isMongoId().withMessage("ID de paciente inválido"),
  handleInputErrors,
  MedicalOrderController.getMedicalOrdersByPatient
);

/* GET /api/medical-orders/:id - Obtener orden por ID */
router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID de orden inválido"),
  handleInputErrors,
  MedicalOrderController.getMedicalOrderById
);

/* PUT /api/medical-orders/:id - Actualizar orden médica */
router.put(
  "/:id",
  checkCanCreate,
  [
    param("id").isMongoId().withMessage("ID de orden inválido"),
    body([
      "hematology",
      "coprology",
      "urinalysis",
      "cytology",
      "hormonal",
      "skin",
      "chemistry",
      "cultures",
      "antigenicTests"
    ]).optional().isArray(),
    
    body("specialExams").optional().isString().trim(),
    body("observations").optional().isString().trim().isLength({ max: 500 }),
    body("status").optional().isIn(["pending", "completed", "cancelled"]),
  ],
  handleInputErrors,
  MedicalOrderController.updateMedicalOrder
);

/* DELETE /api/medical-orders/:id - Eliminar orden médica */
router.delete(
  "/:id",
  checkCanCreate,
  param("id").isMongoId().withMessage("ID de orden inválido"),
  handleInputErrors,
  MedicalOrderController.deleteMedicalOrder
);

export default router;