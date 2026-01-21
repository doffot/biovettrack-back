// src/routes/staffRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { StaffController } from "../controllers/StaffController";
import { authenticate } from "../middleware/auth";
import { checkCanCreate } from "../middleware/checkCanCreate";

// Validaciones para CREAR staff
const createStaffValidation = [
  body("name")
    .notEmpty().withMessage("El nombre es obligatorio")
    .isString().withMessage("El nombre debe ser texto")
    .trim()
    .isLength({ max: 50 }).withMessage("Máximo 50 caracteres"),

  body("lastName")
    .notEmpty().withMessage("El apellido es obligatorio")
    .isString().withMessage("El apellido debe ser texto")
    .trim()
    .isLength({ max: 50 }).withMessage("Máximo 50 caracteres"),

  body("role")
    .isIn(["veterinario", "groomer", "asistente", "recepcionista"])
    .withMessage("Rol no válido"),

  body("phone")
    .optional()
    .isString().withMessage("El teléfono debe ser texto")
    .trim(),

  body("active")
    .optional()
    .isBoolean().withMessage("El estado debe ser verdadero o falso"),
];

// Validaciones para ACTUALIZAR staff
const updateStaffValidation = [
  body("name")
    .optional()
    .isString().withMessage("El nombre debe ser texto")
    .trim()
    .isLength({ max: 50 }).withMessage("Máximo 50 caracteres"),

  body("lastName")
    .optional()
    .isString().withMessage("El apellido debe ser texto")
    .trim()
    .isLength({ max: 50 }).withMessage("Máximo 50 caracteres"),

  body("role")
    .optional()
    .isIn(["veterinario", "groomer", "asistente", "recepcionista"])
    .withMessage("Rol no válido"),

  body("phone")
    .optional()
    .isString().withMessage("El teléfono debe ser texto")
    .trim(),

  body("active")
    .optional()
    .isBoolean().withMessage("El estado debe ser verdadero o falso"),
];


const staffRouter = Router();

// GET /api/staff → todos los miembros del staff
staffRouter.get(
  "/",
  authenticate,
  StaffController.getStaffList
);

// POST /api/staff → crear nuevo staff
staffRouter.post(
  "/",
  authenticate,
  checkCanCreate,
  ...createStaffValidation,
  handleInputErrors,
  StaffController.createStaff
);

// GET /api/staff/:id
staffRouter.get(
  "/:id",
  authenticate,
  param("id").isMongoId().withMessage("ID de staff inválido"),
  handleInputErrors,
  StaffController.getStaffById
);

// PUT /api/staff/:id
staffRouter.put(
  "/:id",
  authenticate,
  checkCanCreate,
  param("id").isMongoId().withMessage("ID de staff inválido"),
  ...updateStaffValidation,
  handleInputErrors,
  StaffController.updateStaff
);

// DELETE /api/staff/:id
staffRouter.delete(
  "/:id",
  authenticate,
  checkCanCreate,
  param("id").isMongoId().withMessage("ID de staff inválido"),
  handleInputErrors,
  StaffController.deleteStaff
);

export default staffRouter;