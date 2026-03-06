// src/routes/labExamRoutes.ts
import { Router } from "express";
import { body, param, query } from "express-validator";
import { LabExamController } from "../controllers/LabExamController";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { checkCanCreate } from "../middleware/checkCanCreate";

const router = Router();

router.use(authenticate);

// =============================================
// VALIDACIONES COMUNES (todos los exámenes)
// =============================================
const commonValidations = [
  body("examType")
    .optional()
    .isString().withMessage("El tipo de examen debe ser texto"),
  body("patientName")
    .notEmpty().withMessage("El nombre del paciente es obligatorio")
    .isString().withMessage("El nombre debe ser texto"),
  body("species")
    .notEmpty().withMessage("La especie es obligatoria")
    .isString().withMessage("La especie debe ser texto"),
  body("breed").optional().isString(),
  body("sex").optional().isString(),
  body("age").optional().isString(),
  body("weight").optional().isFloat({ min: 0 }),
  body("cost")
    .notEmpty().withMessage("El costo es obligatorio")
    .isFloat({ min: 0 }).withMessage("El costo debe ser positivo"),
  body("discount").optional().isFloat({ min: 0 }),
  body("date").isISO8601().withMessage("La fecha debe ser válida"),
  body("treatingVet").optional().isString(),
  body("ownerName").optional().isString(),
  body("ownerPhone").optional().isString(),
];

const commonUpdateValidations = [
  body("patientName").optional().isString(),
  body("species").optional().isString(),
  body("breed").optional().isString(),
  body("sex").optional().isString(),
  body("age").optional().isString(),
  body("weight").optional().isFloat({ min: 0 }),
  body("cost").optional().isFloat({ min: 0 }),
  body("discount").optional().isFloat({ min: 0 }),
  body("date").optional().isISO8601(),
  body("treatingVet").optional().isString(),
  body("ownerName").optional().isString(),
  body("ownerPhone").optional().isString(),
];

// =============================================
// RUTAS
// =============================================

router.post(
  "/",
  checkCanCreate,
  ...commonValidations,
  handleInputErrors,
  LabExamController.createLabExam
);

router.get(
  "/",
  query("examType").optional().isString(),
  LabExamController.getAllLabExams
);

router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID de examen inválido"),
  handleInputErrors,
  LabExamController.getLabExamById
);

router.put(
  "/:id",
  checkCanCreate,
  param("id").isMongoId().withMessage("ID de examen inválido"),
  ...commonUpdateValidations,
  handleInputErrors,
  LabExamController.updateLabExam
);

router.delete(
  "/:id",
  checkCanCreate,
  param("id").isMongoId().withMessage("ID de examen inválido"),
  handleInputErrors,
  LabExamController.deleteLabExam
);

router.get(
  "/patient/:patientId",
  param("patientId").isMongoId().withMessage("ID de paciente inválido"),
  query("examType").optional().isString(),
  handleInputErrors,
  LabExamController.getLabExamsByPatient
);

export default router;