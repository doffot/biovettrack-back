// src/routes/recipeRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { RecipeController } from "../controllers/RecipeController";
import { checkCanCreate } from "../middleware/checkCanCreate";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/* GET /api/recipes - Obtener todas las recetas del veterinario */
router.get(
  "/",
  RecipeController.getAllRecipes
);

/* POST /api/recipes/:patientId - Crear receta */
router.post(
  "/:patientId",
  checkCanCreate,
  [
    param("patientId")
      .isMongoId().withMessage("ID de paciente inválido"),
    body("issueDate")
      .optional()
      .isISO8601().withMessage("Fecha de emisión inválida"),
    body("consultationId")
      .optional()
      .isMongoId().withMessage("ID de consulta inválido"),
    body("medications")
      .isArray({ min: 1 }).withMessage("Debe incluir al menos un medicamento"),
    body("medications.*.name")
      .notEmpty().withMessage("El nombre del medicamento es obligatorio")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("medications.*.presentation")
      .notEmpty().withMessage("La presentación es obligatoria")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("medications.*.source")
      .notEmpty().withMessage("El tipo de uso es obligatorio")
      .isIn(["veterinario", "farmacia"]).withMessage("Debe ser 'veterinario' o 'farmacia'"),
    body("medications.*.instructions")
      .notEmpty().withMessage("El modo de uso es obligatorio")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 300 }).withMessage("Máximo 300 caracteres"),
    body("medications.*.quantity")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 50 }).withMessage("Máximo 50 caracteres"),
    body("notes")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 500 }).withMessage("Máximo 500 caracteres"),
  ],
  handleInputErrors,
  RecipeController.createRecipe
);

/* GET /api/recipes/patient/:patientId - Recetas de un paciente */
router.get(
  "/patient/:patientId",
  param("patientId")
    .isMongoId().withMessage("ID de paciente inválido"),
  handleInputErrors,
  RecipeController.getRecipesByPatient
);

/* GET /api/recipes/:id - Obtener receta por ID */
router.get(
  "/:id",
  param("id")
    .isMongoId().withMessage("ID de receta inválido"),
  handleInputErrors,
  RecipeController.getRecipeById
);

/* PUT /api/recipes/:id - Actualizar receta */
router.put(
  "/:id",
  checkCanCreate,
  [
    param("id")
      .isMongoId().withMessage("ID de receta inválido"),
    body("issueDate")
      .optional()
      .isISO8601().withMessage("Fecha de emisión inválida"),
    body("consultationId")
      .optional()
      .isMongoId().withMessage("ID de consulta inválido"),
    body("medications")
      .optional()
      .isArray({ min: 1 }).withMessage("Debe incluir al menos un medicamento"),
    body("medications.*.name")
      .optional()
      .notEmpty().withMessage("El nombre del medicamento es obligatorio")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("medications.*.presentation")
      .optional()
      .notEmpty().withMessage("La presentación es obligatoria")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("medications.*.source")
      .optional()
      .isIn(["veterinario", "farmacia"]).withMessage("Debe ser 'veterinario' o 'farmacia'"),
    body("medications.*.instructions")
      .optional()
      .notEmpty().withMessage("El modo de uso es obligatorio")
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 300 }).withMessage("Máximo 300 caracteres"),
    body("medications.*.quantity")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 50 }).withMessage("Máximo 50 caracteres"),
    body("notes")
      .optional()
      .isString().withMessage("Debe ser texto")
      .trim().isLength({ max: 500 }).withMessage("Máximo 500 caracteres"),
  ],
  handleInputErrors,
  RecipeController.updateRecipe
);

/* DELETE /api/recipes/:id - Eliminar receta */
router.delete(
  "/:id",
  checkCanCreate,
  param("id")
    .isMongoId().withMessage("ID de receta inválido"),
  handleInputErrors,
  RecipeController.deleteRecipe
);

export default router;