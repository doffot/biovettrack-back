import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { checkCanCreate } from "../middleware/checkCanCreate";
import { DewormingController } from "../controllers/DewormingController";

const router = Router();

router.use(authenticate);

router.get("/", DewormingController.getAllDewormings);

router.post(
  "/:patientId",
  checkCanCreate,
  [
    param("patientId").isMongoId().withMessage("ID de paciente inválido"),
    
    // 1. Corregido: Ahora coincide con el Frontend ("Interno"/"Externo")
    body("source")
      .notEmpty().withMessage("El origen es obligatorio")
      .isIn(["Interno", "Externo"]).withMessage("Origen inválido (Debe ser Interno o Externo)"),

    body("applicationDate")
      .notEmpty().withMessage("La fecha de aplicación es obligatoria")
      .isISO8601().withMessage("Fecha inválida"),
    
    // 2. Corregido: Coincide con el modelo ("Interna", "Externa", "Ambas")
    body("dewormingType")
      .notEmpty().withMessage("El tipo de desparasitación es obligatorio")
      .isIn(["Interna", "Externa", "Ambas"]).withMessage("Tipo inválido"),

    body("productName")
      .notEmpty().withMessage("El nombre del producto es obligatorio")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }),

    body("cost")
      .notEmpty().withMessage("El costo es obligatorio")
      .isFloat({ min: 0 }).withMessage("El costo debe ser un número positivo"),

    body("productId")
      .optional({ nullable: true, checkFalsy: true })
      .isMongoId().withMessage("ID de producto inválido"),

    // 3. Corregido: Nombre del campo sincronizado con el modelo y frontend
    body("nextApplicationDate") 
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601().withMessage("Fecha de próxima aplicación inválida"),
      
    body("dose")
      .notEmpty().withMessage("La dosis es obligatoria"),
  ],
  handleInputErrors,
  DewormingController.createDeworming
);

router.get(
  "/patient/:patientId",
  param("patientId").isMongoId().withMessage("ID de paciente inválido"),
  handleInputErrors,
  DewormingController.getDewormingsByPatient
);

router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID de desparasitación inválido"),
  handleInputErrors,
  DewormingController.getDewormingById
);

router.put(
  "/:id",
  checkCanCreate,
  [
    param("id").isMongoId().withMessage("ID de desparasitación inválido"),
    
    body("source")
      .optional()
      .isIn(["Interno", "Externo"]).withMessage("Origen inválido"),

    body("applicationDate")
      .optional()
      .isISO8601().withMessage("Fecha inválida"),
      
    body("dewormingType")
      .optional()
      .isIn(["Interna", "Externa", "Ambas"]).withMessage("Tipo inválido"),

    body("productName")
      .optional()
      .isString().trim().isLength({ max: 100 }),

    body("cost")
      .optional()
      .isFloat({ min: 0 }).withMessage("El costo debe ser un número positivo"),

    body("productId")
      .optional({ nullable: true, checkFalsy: true })
      .isMongoId().withMessage("ID de producto inválido"),

    body("nextApplicationDate")
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601().withMessage("Fecha inválida"),
  ],
  handleInputErrors,
  DewormingController.updateDeworming
);

router.delete(
  "/:id",
  checkCanCreate,
  param("id").isMongoId().withMessage("ID de desparasitación inválido"),
  handleInputErrors,
  DewormingController.deleteDeworming
);

export default router;