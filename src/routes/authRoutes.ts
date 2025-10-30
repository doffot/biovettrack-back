// src/routes/authRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { AuthController } from "../controllers/AuthController";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * ✅ Crear cuenta de Veterinario
 * POST /api/auth/create-account
 */
router.post(
  "/create-account",
  [
    // Nombre
    body("name")
      .notEmpty()
      .withMessage("El nombre es obligatorio")
      .isString()
      .withMessage("El nombre debe ser texto")
      .trim()
      .isLength({ min: 2 })
      .withMessage("El nombre debe tener al menos 2 caracteres")
      .isLength({ max: 50 })
      .withMessage("El nombre no puede exceder 50 caracteres"),

    // Apellido
    body("lastName")
      .notEmpty()
      .withMessage("El apellido es obligatorio")
      .isString()
      .withMessage("El apellido debe ser texto")
      .trim()
      .isLength({ min: 2 })
      .withMessage("El apellido debe tener al menos 2 caracteres")
      .isLength({ max: 50 })
      .withMessage("El apellido no puede exceder 50 caracteres"),

    // Email
    body("email")
      .isEmail()
      .withMessage("Formato de correo inválido")
      .normalizeEmail()
      .notEmpty()
      .withMessage("El correo es obligatorio"),

    // Contraseña
    body("password")
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres"),

    // Confirmar contraseña
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Las contraseñas no coinciden");
      }
      return true;
    }),

    // WhatsApp
    body("whatsapp")
      .notEmpty()
      .withMessage("El número de WhatsApp es obligatorio")
      .matches(/^\+?[1-9]\d{6,14}$/)
      .withMessage(
        "Debe ser un número internacional válido (ej: +573001234567)"
      )
      .trim(),

    // CI (Cédula de Identidad)
    body("ci")
      .notEmpty()
      .withMessage("La CI es obligatoria")
      .trim()
      .isLength({ min: 5, max: 20 })
      .withMessage("La CI debe tener entre 5 y 20 caracteres"),

    // CMV (Colegio de Médicos Veterinarios) - ✅ Cambiado de cmvz a cmv
    body("cmv")
      .notEmpty()
      .withMessage("El número de colegio (CMV) es obligatorio")
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("El CMV debe tener entre 3 y 20 caracteres"),

    // Estado (Estados de Venezuela)
    body("estado")
      .notEmpty()
      .withMessage("El estado es obligatorio")
      .isIn([
        "Amazonas",
        "Anzoátegui",
        "Apure",
        "Aragua",
        "Barinas",
        "Bolívar",
        "Carabobo",
        "Cojedes",
        "Delta Amacuro",
        "Distrito Capital",
        "Falcón",
        "Guárico",
        "Lara",
        "Mérida",
        "Miranda",
        "Monagas",
        "Nueva Esparta",
        "Portuguesa",
        "Sucre",
        "Táchira",
        "Trujillo",
        "Vargas",
        "Yaracuy",
        "Zulia",
      ])
      .withMessage("El estado ingresado no es válido"),

    // RUNSAI (opcional)
    body("runsai")
      .optional()
      .isString()
      .withMessage("RUNSAI debe ser texto")
      .trim()
      .isLength({ max: 30 })
      .withMessage("RUNSAI no puede exceder 30 caracteres"),

    // MSDS (Maestría, especialidad, etc.)
    body("msds")
      .optional()
      .isString()
      .withMessage("MSDS debe ser texto")
      .trim()
      .isLength({ max: 100 })
      .withMessage("MSDS no puede exceder 100 caracteres"),

    // SOMEVEPA (Sociedad veterinaria)
    body("somevepa")
      .optional()
      .isString()
      .withMessage("SOMEVEPA debe ser texto")
      .trim()
      .isLength({ max: 100 })
      .withMessage("SOMEVEPA no puede exceder 100 caracteres"),
  ],
  handleInputErrors,
  AuthController.createAccount
);

router.post(
  "/confirm-account",
  body("token").notEmpty().withMessage("El token es obligatorio"),
  handleInputErrors,
  AuthController.confirmAccount
);

router.post(
  "/login",
  body("email")
    .isEmail()
    .withMessage("Formato de correo inválido")
    .normalizeEmail()
    .notEmpty()
    .withMessage("El correo es obligatorio"),
  body("password").notEmpty().withMessage("La contraseña es obligatoria"),
  handleInputErrors,
  AuthController.login
);

router.post(
  "/request-new-token",
  body("email")
    .isEmail()
    .withMessage("Formato de correo inválido")
    .normalizeEmail()
    .notEmpty()
    .withMessage("El correo es obligatorio"),
  handleInputErrors,
  AuthController.requestNewToken
);
router.post(
  "/forgot-password",
  body("email")
    .isEmail()
    .withMessage("Formato de correo inválido")
    .normalizeEmail()
    .notEmpty()
    .withMessage("El correo es obligatorio"),
  handleInputErrors,
  AuthController.forgotPassword
);

router.post(
  "/validate-token",
  body("token").notEmpty().withMessage("El token es obligatorio"),
  handleInputErrors,
  AuthController.validateToken
);

router.post(
  "/update-password/:token",
  param('token').isNumeric().withMessage('El token no es valido'),
  // Contraseña
  body("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres"),

  // Confirmar contraseña
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Las contraseñas no coinciden");
    }
    return true;
  }),
  handleInputErrors,
  AuthController.updatePasswordWithToken
);

router.get('/user',
  authenticate,
  AuthController.user
)

export default router;
