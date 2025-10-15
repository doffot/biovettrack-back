// src/routes/labExamRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { LabExamController } from "../controllers/LabExamController";
import { handleInputErrors } from "../middleware/validation";

const router = Router({ mergeParams: true }); // ✅ Permite acceder a :patientId

/* POST /api/patients/:patientId/lab-exams */
router.post(
  "/",
  param("patientId").isMongoId().withMessage("ID de paciente inválido"),
  body("date")
    .optional()
    .isISO8601().withMessage("La fecha debe ser válida"),
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
  body("totalCells")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Total de células entre 0 y 100"),
  body("differentialCount")
    .isObject().withMessage("Conteo diferencial es obligatorio"),
  body("differentialCount.segmentedNeutrophils")
    .isFloat({ min: 0, max: 100 }).optional({ nullable: true }),
  body("differentialCount.bandNeutrophils")
    .isFloat({ min: 0, max: 100 }).optional({ nullable: true }),
  body("differentialCount.lymphocytes")
    .isFloat({ min: 0, max: 100 }).optional({ nullable: true }),
  body("differentialCount.monocytes")
    .isFloat({ min: 0, max: 100 }).optional({ nullable: true }),
  body("differentialCount.basophils")
    .isFloat({ min: 0, max: 100 }).optional({ nullable: true }),
  body("differentialCount.reticulocytes")
    .isFloat({ min: 0, max: 100 }).optional({ nullable: true }),
  body("differentialCount.eosinophils")
    .isFloat({ min: 0, max: 100 }).optional({ nullable: true }),
  body("differentialCount.nrbc")
    .isFloat({ min: 0, max: 100 }).optional({ nullable: true }),
  // ✅ Agregado: campos nuevos, con tu estilo
  body("hemotropico").optional().isString().withMessage("Hemotrópico debe ser texto"),
  body("observacion").optional().isString().withMessage("Observación debe ser texto"),
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
  // ✅ También en PUT, con tu estilo
  body("hemotropico").optional().isString().withMessage("Hemotrópico debe ser texto"),
  body("observacion").optional().isString().withMessage("Observación debe ser texto"),
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