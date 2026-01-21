// src/routes/labExamRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { LabExamController } from "../controllers/LabExamController";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { checkCanCreate } from "../middleware/checkCanCreate";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  checkCanCreate,
  body("patientName")
    .notEmpty().withMessage("El nombre del paciente es obligatorio")
    .isString().withMessage("El nombre debe ser texto"),
  body("species")
    .notEmpty().withMessage("La especie es obligatoria")
    .isString().withMessage("La especie debe ser texto"),
  body("breed").optional().isString().withMessage("La raza debe ser texto"),
  body("sex").optional().isString().withMessage("El sexo debe ser texto"),
  body("age").optional().isString().withMessage("La edad debe ser texto"),
  body("weight").optional().isFloat({ min: 0 }).withMessage("El peso debe ser un número positivo"),
  body("cost")
    .isFloat({ min: 0 }).withMessage("El costo debe ser un número positivo")
    .notEmpty().withMessage("El costo del examen es obligatorio"),
  body("discount")
    .optional()
    .isFloat({ min: 0 }).withMessage("El descuento debe ser un número positivo"),
  body("date")
    .isISO8601().withMessage("La fecha debe ser válida"),
  body("hematocrit")
    .isFloat({ min: 0 }).withMessage("Hematocrito debe ser un número positivo"),
  body("whiteBloodCells")
    .isFloat({ min: 0 }).withMessage("Glóbulos blancos deben ser un número positivo"),
  body("totalProtein")
    .isFloat({ min: 0 }).withMessage("Proteínas totales deben ser un número positivo"),
  body("platelets")
    .isFloat({ min: 0 }).withMessage("Plaquetas deben ser un número positivo"),
  body("totalCells")
    .isFloat({ min: 0, max: 100 }).withMessage("Total de células entre 0 y 100"),
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
  body("treatingVet").optional().isString().withMessage("El veterinario tratante debe ser texto"),
  body("hemotropico").optional().isString().withMessage("Hemotrópico debe ser texto"),
  body("observacion").optional().isString().withMessage("Observación debe ser texto"),
  body("ownerName").optional().isString().withMessage("El nombre del dueño debe ser texto"),
  body("ownerPhone").optional().isString().withMessage("El teléfono del dueño debe ser texto"),
  handleInputErrors,
  LabExamController.createLabExam
);

router.get("/", LabExamController.getAllLabExams);

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
  body("patientName").optional().isString().withMessage("El nombre debe ser texto"),
  body("species").optional().isString().withMessage("La especie debe ser texto"),
  body("breed").optional().isString(),
  body("sex").optional().isString(),
  body("age").optional().isString(),
  body("weight").optional().isFloat({ min: 0 }),
  body("cost").optional().isFloat({ min: 0 }).withMessage("El costo debe ser un número positivo"),
  body("discount").optional().isFloat({ min: 0 }).withMessage("El descuento debe ser un número positivo"),
  body("date").optional().isISO8601(),
  body("hematocrit").optional().isFloat({ min: 0 }),
  body("whiteBloodCells").optional().isFloat({ min: 0 }),
  body("totalProtein").optional().isFloat({ min: 0 }),
  body("platelets").optional().isFloat({ min: 0 }),
  body("totalCells").optional().isFloat({ min: 0, max: 100 }),
  body("differentialCount").optional().isObject(),
  body("treatingVet").optional().isString(),
  body("hemotropico").optional().isString(),
  body("observacion").optional().isString(),
  body("ownerName").optional().isString(),
  body("ownerPhone").optional().isString(),
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
  handleInputErrors,
  LabExamController.getLabExamsByPatient
);

export default router;