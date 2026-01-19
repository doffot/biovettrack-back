// src/routes/treatmentRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { TreatmentController } from "../controllers/TreatmentController";

const router = Router();

router.use(authenticate);

router.get("/", TreatmentController.getAllTreatments);

router.post(
  "/:patientId",
  [
    param("patientId").isMongoId().withMessage("ID de paciente inválido"),
    body("startDate").notEmpty().withMessage("La fecha de inicio es obligatoria").isISO8601().withMessage("Fecha inválida"),
    body("treatmentType").notEmpty().withMessage("El tipo de tratamiento es obligatorio").isIn(["Antibiótico", "Antiinflamatorio", "Analgésico", "Suplemento", "Otro"]).withMessage("Tipo inválido"),
    body("treatmentTypeOther").if(body("treatmentType").equals("Otro")).notEmpty().withMessage("Debes especificar el tipo personalizado").trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("productName").optional().isString().withMessage("Debe ser texto").trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("dose").notEmpty().withMessage("La dosis es obligatoria").isString().withMessage("Debe ser texto").trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("frequency").notEmpty().withMessage("La frecuencia es obligatoria").isString().withMessage("Debe ser texto").trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("duration").notEmpty().withMessage("La duración es obligatoria").isString().withMessage("Debe ser texto").trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("route").notEmpty().withMessage("La vía de administración es obligatoria").isIn(["Oral", "Inyectable", "Tópica", "Intravenosa", "Subcutánea", "Otro"]).withMessage("Vía de administración inválida"),
    body("routeOther").if(body("route").equals("Otro")).notEmpty().withMessage("Debes especificar la vía personalizada").trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("cost").optional().isFloat({ min: 0 }).withMessage("El costo debe ser un número positivo"),
    body("productId").optional().isMongoId().withMessage("ID de producto inválido"),
    body("endDate").optional().isISO8601().withMessage("Fecha de fin inválida"),
    body("observations").optional().isString().withMessage("Debe ser texto").trim().isLength({ max: 500 }).withMessage("Máximo 500 caracteres"),
    body("status").optional().isIn(["Activo", "Completado", "Suspendido"]).withMessage("Estado inválido"),
  ],
  handleInputErrors,
  TreatmentController.createTreatment
);

router.get("/patient/:patientId", param("patientId").isMongoId().withMessage("ID de paciente inválido"), handleInputErrors, TreatmentController.getTreatmentsByPatient);

router.get("/:id", param("id").isMongoId().withMessage("ID de tratamiento inválido"), handleInputErrors, TreatmentController.getTreatmentById);

router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("ID de tratamiento inválido"),
    body("startDate").optional().isISO8601().withMessage("Fecha inválida"),
    body("treatmentType").optional().isIn(["Antibiótico", "Antiinflamatorio", "Analgésico", "Suplemento", "Otro"]).withMessage("Tipo inválido"),
    body("treatmentTypeOther").if(body("treatmentType").equals("Otro")).notEmpty().withMessage("Debes especificar el tipo personalizado").trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("productName").optional().isString().withMessage("Debe ser texto").trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("dose").optional().isString().withMessage("Debe ser texto").trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("frequency").optional().isString().withMessage("Debe ser texto").trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("duration").optional().isString().withMessage("Debe ser texto").trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("route").optional().isIn(["Oral", "Inyectable", "Tópica", "Intravenosa", "Subcutánea", "Otro"]).withMessage("Vía de administración inválida"),
    body("routeOther").if(body("route").equals("Otro")).notEmpty().withMessage("Debes especificar la vía personalizada").trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("cost").optional().isFloat({ min: 0 }).withMessage("El costo debe ser un número positivo"),
    body("productId").optional().isMongoId().withMessage("ID de producto inválido"),
    body("endDate").optional().isISO8601().withMessage("Fecha de fin inválida"),
    body("observations").optional().isString().withMessage("Debe ser texto").trim().isLength({ max: 500 }).withMessage("Máximo 500 caracteres"),
    body("status").optional().isIn(["Activo", "Completado", "Suspendido"]).withMessage("Estado inválido"),
  ],
  handleInputErrors,
  TreatmentController.updateTreatment
);

router.delete("/:id", param("id").isMongoId().withMessage("ID de tratamiento inválido"), handleInputErrors, TreatmentController.deleteTreatment);

export default router;