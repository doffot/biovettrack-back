// src/routes/vaccinationRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import {  handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { VaccinationController } from "../controllers/VaccinationController";

const router = Router();

//  Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

router.get(
  "/",
  VaccinationController.getAllVaccinations
);

/* POST /api/vaccinations/:patientId */
router.post(
  "/:patientId",
  [
    param("patientId").isMongoId().withMessage("ID de paciente inválido"),
    body("vaccinationDate")
      .notEmpty().withMessage("La fecha de vacunación es obligatoria")
      .isISO8601().withMessage("Fecha inválida"),
    body("vaccineType")
      .notEmpty().withMessage("El tipo de vacuna es obligatorio")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 50 }).withMessage("Máximo 50 caracteres"),
    body("cost")
      .notEmpty().withMessage("El costo es obligatorio")
      .isFloat({ min: 0 }).withMessage("El costo debe ser un número positivo"),
    body("laboratory")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("batchNumber")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 50 }).withMessage("Máximo 50 caracteres"),
    body("expirationDate")
      .optional()
      .isISO8601().withMessage("Fecha de vencimiento inválida"),
    body("nextVaccinationDate")
      .optional()
      .isISO8601().withMessage("Fecha de próxima vacuna inválida"),
    body("observations")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 300 }).withMessage("Máximo 300 caracteres"),
  ],
  handleInputErrors,
  VaccinationController.createVaccination
);

/* GET /api/vaccinations/patient/:patientId */
router.get(
  "/patient/:patientId",
  param("patientId").isMongoId().withMessage("ID de paciente inválido"),
  handleInputErrors,
  VaccinationController.getVaccinationsByPatient
);

/* GET /api/vaccinations/:id */
router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID de vacuna inválido"),
  handleInputErrors,
  VaccinationController.getVaccinationById
);

/* PUT /api/vaccinations/:id */
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("ID de vacuna inválido"),
    body("vaccinationDate")
      .optional()
      .isISO8601().withMessage("Fecha inválida"),
    body("vaccineType")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 50 }).withMessage("Máximo 50 caracteres"),
    body("cost")
      .optional()
      .isFloat({ min: 0 }).withMessage("El costo debe ser un número positivo"),
    body("laboratory")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("batchNumber")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 50 }).withMessage("Máximo 50 caracteres"),
    body("expirationDate")
      .optional()
      .isISO8601().withMessage("Fecha de vencimiento inválida"),
    body("nextVaccinationDate")
      .optional()
      .isISO8601().withMessage("Fecha de próxima vacuna inválida"),
    body("observations")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 300 }).withMessage("Máximo 300 caracteres"),
  ],
  handleInputErrors,
  VaccinationController.updateVaccination
);

/* DELETE /api/vaccinations/:id */
router.delete(
  "/:id",
  param("id").isMongoId().withMessage("ID de vacuna inválido"),
  handleInputErrors,
  VaccinationController.deleteVaccination
);

export default router;