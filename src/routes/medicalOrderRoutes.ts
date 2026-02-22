// src/routes/medicalOrderRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { MedicalOrderController } from "../controllers/MedicalOrderController";
import { checkCanCreate } from "../middleware/checkCanCreate";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Tipos de estudio válidos
const VALID_STUDY_TYPES = [
  "ecografia",
  "radiografia",
  "laboratorio",
  "tomografia",
  "electrocardiograma",
  "endoscopia",
  "citologia",
  "biopsia",
  "otro",
];

const VALID_PRIORITIES = ["normal", "urgente"];

/* GET /api/medical-orders - Obtener todas las órdenes del veterinario */
router.get(
  "/",
  MedicalOrderController.getAllMedicalOrders
);

/* POST /api/medical-orders/:patientId - Crear orden médica */
router.post(
  "/:patientId",
  checkCanCreate,
  [
    param("patientId")
      .isMongoId().withMessage("ID de paciente inválido"),
    body("issueDate")
      .optional()
      .isISO8601().withMessage("Fecha de emisión inválida"),
    body("consultationId")
      .optional()
      .isMongoId().withMessage("ID de consulta inválido"),
    body("studies")
      .isArray({ min: 1 }).withMessage("Debe incluir al menos un estudio"),
    body("studies.*.type")
      .notEmpty().withMessage("El tipo de estudio es obligatorio")
      .isIn(VALID_STUDY_TYPES).withMessage("Tipo de estudio no válido"),
    body("studies.*.name")
      .notEmpty().withMessage("El nombre del estudio es obligatorio")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 150 }).withMessage("Máximo 150 caracteres"),
    body("studies.*.region")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("studies.*.reason")
      .notEmpty().withMessage("El motivo es obligatorio")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 300 }).withMessage("Máximo 300 caracteres"),
    body("studies.*.priority")
      .optional()
      .isIn(VALID_PRIORITIES).withMessage("Debe ser 'normal' o 'urgente'"),
    body("studies.*.instructions")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 300 }).withMessage("Máximo 300 caracteres"),
    body("clinicalHistory")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 1000 }).withMessage("Máximo 1000 caracteres"),
  ],
  handleInputErrors,
  MedicalOrderController.createMedicalOrder
);

/* GET /api/medical-orders/patient/:patientId - Órdenes de un paciente */
router.get(
  "/patient/:patientId",
  param("patientId")
    .isMongoId().withMessage("ID de paciente inválido"),
  handleInputErrors,
  MedicalOrderController.getMedicalOrdersByPatient
);

/* GET /api/medical-orders/:id - Obtener orden por ID */
router.get(
  "/:id",
  param("id")
    .isMongoId().withMessage("ID de orden inválido"),
  handleInputErrors,
  MedicalOrderController.getMedicalOrderById
);

/* PUT /api/medical-orders/:id - Actualizar orden médica */
router.put(
  "/:id",
  checkCanCreate,
  [
    param("id")
      .isMongoId().withMessage("ID de orden inválido"),
    body("issueDate")
      .optional()
      .isISO8601().withMessage("Fecha de emisión inválida"),
    body("consultationId")
      .optional()
      .isMongoId().withMessage("ID de consulta inválido"),
    body("studies")
      .optional()
      .isArray({ min: 1 }).withMessage("Debe incluir al menos un estudio"),
    body("studies.*.type")
      .optional()
      .isIn(VALID_STUDY_TYPES).withMessage("Tipo de estudio no válido"),
    body("studies.*.name")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 150 }).withMessage("Máximo 150 caracteres"),
    body("studies.*.region")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("studies.*.reason")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 300 }).withMessage("Máximo 300 caracteres"),
    body("studies.*.priority")
      .optional()
      .isIn(VALID_PRIORITIES).withMessage("Debe ser 'normal' o 'urgente'"),
    body("studies.*.instructions")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 300 }).withMessage("Máximo 300 caracteres"),
    body("clinicalHistory")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 1000 }).withMessage("Máximo 1000 caracteres"),
  ],
  handleInputErrors,
  MedicalOrderController.updateMedicalOrder
);

/* DELETE /api/medical-orders/:id - Eliminar orden médica */
router.delete(
  "/:id",
  checkCanCreate,
  param("id")
    .isMongoId().withMessage("ID de orden inválido"),
  handleInputErrors,
  MedicalOrderController.deleteMedicalOrder
);

export default router;