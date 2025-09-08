// src/routes/labExamRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { LabExamController } from "../controllers/LabExamController";
import { handleInputErrors } from "../middleware/validation";

const router = Router({ mergeParams: true }); // <-- permite leer :patientId

/* POST /api/patients/:patientId/lab-exams */
router.post(
  "/",
  param("patientId").isMongoId().withMessage("ID de paciente inválido"),
  body("hematocrit")
    .isFloat({ min: 0 })
    .withMessage("Hematocrito debe ser un número positivo"),
  body("whiteBloodCells")
    .isFloat({ min: 0 })
    .withMessage("Glóbulos blancos deben ser un número positivo"),
  body("totalProtein")
    .isFloat({ min: 0 })
    .withMessage("Proteínas totales deben ser un número positivo"),
  body("platelets")
    .isFloat({ min: 0 })
    .withMessage("Plaquetas deben ser un número positivo"),
  body("differentialCount.segmentedNeutrophils").isInt({ min: 0, max: 100 }),
  body("differentialCount.bandNeutrophils").isInt({ min: 0, max: 100 }),
  body("differentialCount.lymphocytes").isInt({ min: 0, max: 100 }),
  body("differentialCount.monocytes").isInt({ min: 0, max: 100 }),
  body("differentialCount.basophils").isInt({ min: 0, max: 100 }),
  body("differentialCount.reticulocytes").isInt({ min: 0, max: 100 }),
  body("differentialCount.eosinophils").isInt({ min: 0, max: 100 }),
  body("differentialCount.nrbc").isInt({ min: 0, max: 100 }),
  body("totalCells").isInt({ min: 0, max: 100 }),
  handleInputErrors,
  LabExamController.createLabExam
);

/* GET /api/patients/:patientId/lab-exams */
router.get("/", LabExamController.getLabExamsByPatient);

/* GET /api/patients/:patientId/lab-exams/:id */
router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID de examen inválido"),
  handleInputErrors,
  LabExamController.getLabExamById
);

/* PUT /api/patients/:patientId/lab-exams/:id */
router.put(
  "/:id",
  param("id").isMongoId().withMessage("ID de examen inválido"),
  // (mismas validaciones opcionales que arriba)
  handleInputErrors,
  LabExamController.updateLabExam
);

/* DELETE /api/patients/:patientId/lab-exams/:id */
router.delete(
  "/:id",
  param("id").isMongoId().withMessage("ID de examen inválido"),
  handleInputErrors,
  LabExamController.deleteLabExam
);

export default router;
