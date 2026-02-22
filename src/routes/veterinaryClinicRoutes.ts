// src/routes/veterinaryClinicRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { VeterinaryClinicController } from "../controllers/VeterinaryClinicController";
import upload from "../middleware/upload";
import { authenticate } from "../middleware/auth";

const router = Router();

// ══════════════════════════════════════════
// VALIDACIONES
// ══════════════════════════════════════════

const clinicValidation = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("El nombre no puede estar vacío")
    .isString()
    .withMessage("El nombre debe ser texto")
    .trim()
    .isLength({ max: 150 })
    .withMessage("El nombre no puede exceder 150 caracteres"),

  body("rif")
    .optional()
    .isString()
    .withMessage("El RIF debe ser texto")
    .trim()
    .isLength({ max: 20 })
    .withMessage("El RIF no puede exceder 20 caracteres"),

  body("phone")
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]{7,}$/)
    .withMessage("Número de teléfono inválido"),

  body("whatsapp")
    .optional()
    .matches(/^[\+]?[0-9]{10,15}$/)
    .withMessage("Número de WhatsApp inválido (solo números, puede incluir +)"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail(),

  body("address")
    .optional()
    .isString()
    .withMessage("La dirección debe ser texto")
    .trim()
    .isLength({ max: 250 })
    .withMessage("La dirección no puede exceder 250 caracteres"),

  body("city")
    .optional()
    .isString()
    .withMessage("La ciudad debe ser texto")
    .trim()
    .isLength({ max: 100 })
    .withMessage("La ciudad no puede exceder 100 caracteres"),

  body("country")
    .optional()
    .isString()
    .withMessage("El país debe ser texto")
    .trim()
    .isLength({ max: 100 })
    .withMessage("El país no puede exceder 100 caracteres"),

  body("postalCode")
    .optional()
    .isString()
    .withMessage("El código postal debe ser texto")
    .trim()
    .isLength({ max: 20 })
    .withMessage("El código postal no puede exceder 20 caracteres"),

  body("website")
    .optional()
    .matches(/^https?:\/\/.+/)
    .withMessage("La URL del sitio web debe comenzar con http:// o https://"),

  body("socialMedia")
    .optional()
    .custom((value) => {
      // Puede venir como string JSON o ya parseado
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error("socialMedia debe ser un array");
          }
          // Validar estructura de cada elemento
          parsed.forEach((item: any) => {
            if (!item.platform || !item.url) {
              throw new Error(
                "Cada red social debe tener 'platform' y 'url'"
              );
            }
            if (
              ![
                "facebook",
                "instagram",
                "twitter",
                "tiktok",
                "youtube",
                "linkedin",
                "otro",
              ].includes(item.platform)
            ) {
              throw new Error(`Plataforma inválida: ${item.platform}`);
            }
            if (!/^https?:\/\/.+/.test(item.url)) {
              throw new Error(`URL inválida para ${item.platform}`);
            }
          });
        } catch (e: any) {
          throw new Error(e.message || "socialMedia inválido");
        }
      } else if (Array.isArray(value)) {
        value.forEach((item: any) => {
          if (!item.platform || !item.url) {
            throw new Error("Cada red social debe tener 'platform' y 'url'");
          }
        });
      }
      return true;
    }),

  body("businessHours")
    .optional()
    .isString()
    .withMessage("El horario debe ser texto")
    .trim()
    .isLength({ max: 500 })
    .withMessage("El horario no puede exceder 500 caracteres"),

  body("services")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error("services debe ser un array");
          }
        } catch (e) {
          throw new Error("services debe ser un array JSON válido");
        }
      } else if (!Array.isArray(value)) {
        throw new Error("services debe ser un array");
      }
      return true;
    }),

  body("description")
    .optional()
    .isString()
    .withMessage("La descripción debe ser texto")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("La descripción no puede exceder 1000 caracteres"),
];

// ══════════════════════════════════════════
// RUTAS
// ══════════════════════════════════════════

// Crear mi clínica
router.post(
  "/",
  authenticate,
  upload.single("logo"),
  ...clinicValidation,
  handleInputErrors,
  VeterinaryClinicController.createClinic
);

// Obtener mi clínica
router.get(
  "/my-clinic",
  authenticate,
  VeterinaryClinicController.getMyClinic
);

// Obtener clínica por ID (público o para otros vets)
router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID inválido"),
  handleInputErrors,
  VeterinaryClinicController.getClinicById
);

// Actualizar mi clínica
router.put(
  "/",
  authenticate,
  upload.single("logo"),
  ...clinicValidation,
  handleInputErrors,
  VeterinaryClinicController.updateClinic
);

// Eliminar mi clínica
router.delete(
  "/",
  authenticate,
  VeterinaryClinicController.deleteClinic
);

// Eliminar solo el logo
router.delete(
  "/logo",
  authenticate,
  VeterinaryClinicController.deleteLogo
);

export default router;