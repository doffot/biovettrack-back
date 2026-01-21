// src/routes/medicalStudyRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { MedicalStudyController } from "../controllers/MedicalStudyController";
import uploadPDF from "../middleware/uploadPDF";
import { checkCanCreate } from "../middleware/checkCanCreate";

const router = Router();

router.use(authenticate);

/* POST /api/medical-studies/:patientId */
router.post(
  "/:patientId",
  checkCanCreate,
  uploadPDF.single("pdfFile"),
  [
    param("patientId").isMongoId().withMessage("ID de paciente inválido"),
    body("professional")
      .notEmpty().withMessage("El nombre del profesional es obligatorio")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("studyType")
      .notEmpty().withMessage("El tipo de estudio es obligatorio")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 50 }).withMessage("Máximo 50 caracteres"),
    body("date")
      .notEmpty().withMessage("La fecha es obligatoria")
      .isISO8601().withMessage("Fecha inválida"),
    body("presumptiveDiagnosis")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 500 }).withMessage("Máximo 500 caracteres"),
    body("notes")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 300 }).withMessage("Máximo 300 caracteres"),
  ],
  handleInputErrors,
  MedicalStudyController.createMedicalStudy
);

/* GET /api/medical-studies/patient/:patientId */
router.get(
  "/patient/:patientId",
  param("patientId").isMongoId().withMessage("ID de paciente inválido"),
  handleInputErrors,
  MedicalStudyController.getStudiesByPatient
);

/* GET /api/medical-studies/:id */
router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID de estudio inválido"),
  handleInputErrors,
  MedicalStudyController.getMedicalStudyById
);

/* DELETE /api/medical-studies/:id */
router.delete(
  "/:id",
  checkCanCreate,
  param("id").isMongoId().withMessage("ID de estudio inválido"),
  handleInputErrors,
  MedicalStudyController.deleteMedicalStudy
);

export default router;