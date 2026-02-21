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
  uploadPDF.single("pdfFile"), // 1. Multer procesa el archivo primero
  [
    // 2. Luego validamos los campos de texto
    param("patientId").isMongoId().withMessage("ID de paciente inválido"),
    body("professional")
      .notEmpty().withMessage("El profesional es obligatorio"),
    body("studyType")
      .notEmpty().withMessage("El tipo de estudio es obligatorio"),
    body("date")
      .notEmpty().withMessage("La fecha es obligatoria"),
  ],
  handleInputErrors,
  MedicalStudyController.createMedicalStudy
);

router.get(
  "/patient/:patientId",
  param("patientId").isMongoId(),
  handleInputErrors,
  MedicalStudyController.getStudiesByPatient
);

router.get(
  "/:id",
  param("id").isMongoId(),
  handleInputErrors,
  MedicalStudyController.getMedicalStudyById
);

router.delete(
  "/:id",
  checkCanCreate,
  param("id").isMongoId(),
  handleInputErrors,
  MedicalStudyController.deleteMedicalStudy
);

export default router;