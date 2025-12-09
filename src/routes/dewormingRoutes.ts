// src/routes/dewormingRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { DewormingController } from "../controllers/DewormingController";

const router = Router();

router.use(authenticate);


router.get(
  "/",
  DewormingController.getAllDewormings
);
/* POST /api/dewormings/:patientId */
router.post(
  "/:patientId",
  [
    param("patientId").isMongoId().withMessage("ID de paciente inválido"),
    body("applicationDate")
      .notEmpty().withMessage("La fecha de aplicación es obligatoria")
      .isISO8601().withMessage("Fecha inválida"),
    body("dewormingType")
      .notEmpty().withMessage("El tipo de desparasitación es obligatorio")
      .isIn(["Interna", "Externa", "Ambas"]).withMessage("Tipo inválido: debe ser Interna, Externa o Ambas"),
    body("productName")
      .notEmpty().withMessage("El nombre del producto es obligatorio")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("dose")
      .notEmpty().withMessage("La dosis aplicada es obligatoria")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 50 }).withMessage("Máximo 50 caracteres"),
    body("cost")
      .notEmpty().withMessage("El costo es obligatorio")
      .isFloat({ min: 0 }).withMessage("El costo debe ser un número positivo"),
    body("nextApplicationDate")
      .optional()
      .isISO8601().withMessage("Fecha de próxima aplicación inválida"),
  ],
  handleInputErrors,
  DewormingController.createDeworming
);

/* GET /api/dewormings/patient/:patientId */
router.get(
  "/patient/:patientId",
  param("patientId").isMongoId().withMessage("ID de paciente inválido"),
  handleInputErrors,
  DewormingController.getDewormingsByPatient
);

/* GET /api/dewormings/:id */
router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID de desparasitación inválido"),
  handleInputErrors,
  DewormingController.getDewormingById
);

/* PUT /api/dewormings/:id */
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("ID de desparasitación inválido"),
    body("applicationDate")
      .optional()
      .isISO8601().withMessage("Fecha inválida"),
    body("dewormingType")
      .optional()
      .isIn(["Interna", "Externa", "Ambas"]).withMessage("Tipo inválido"),
    body("productName")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("dose")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 50 }).withMessage("Máximo 50 caracteres"),
    body("cost")
      .optional()
      .isFloat({ min: 0 }).withMessage("El costo debe ser un número positivo"),
    body("nextApplicationDate")
      .optional()
      .isISO8601().withMessage("Fecha de próxima aplicación inválida"),
  ],
  handleInputErrors,
  DewormingController.updateDeworming
);

/* DELETE /api/dewormings/:id */
router.delete(
  "/:id",
  param("id").isMongoId().withMessage("ID de desparasitación inválido"),
  handleInputErrors,
  DewormingController.deleteDeworming
);

export default router;