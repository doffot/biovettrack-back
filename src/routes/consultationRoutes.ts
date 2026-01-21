// src/routes/consultationRoutes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { checkCanCreate } from "../middleware/checkCanCreate";
import { ConsultationController } from "../controllers/ConsultationController";

const router = Router();
router.use(authenticate);

router.get(
  "/draft/:patientId",
  param("patientId").isMongoId().withMessage("ID de paciente inválido"),
  handleInputErrors,
  ConsultationController.getDraft
);

router.post(
  "/draft/:patientId",
  checkCanCreate,
  param("patientId").isMongoId().withMessage("ID de paciente inválido"),
  handleInputErrors,
  ConsultationController.saveDraft
);

router.get(
  "/",
  ConsultationController.getAllConsultations
);

router.post(
  "/:patientId",
  checkCanCreate,
  [
    param("patientId").isMongoId().withMessage("ID de paciente inválido"),
    body("reasonForVisit").notEmpty().withMessage("Motivo obligatorio").isString().trim().isLength({ max: 300 }),
    body("symptomOnset").notEmpty().withMessage("Fecha inicio obligatoria").isString().trim().isLength({ max: 100 }),
    body("symptomEvolution").isIn(['empeorado', 'mejorado', 'estable']).withMessage("Evolución inválida"),
    body("isNeutered").isBoolean().withMessage("Campo obligatorio"),
    body("cohabitantAnimals").optional().isString().trim().isLength({ max: 100 }),
    body("contactWithStrays").optional().isString().trim().isLength({ max: 100 }),
    body("feeding").optional().isString().trim().isLength({ max: 200 }),
    body("appetite").isIn(['Normal', 'Mucho', 'Poco', 'Nada']).withMessage("Apetito inválido"),
    body("vomiting").optional().isString().trim().isLength({ max: 200 }),
    body("bowelMovementFrequency").optional().isString().trim().isLength({ max: 100 }),
    body("stoolConsistency").optional().isIn(['normal', 'dura', 'pastosa', 'líquida']).withMessage("Consistencia inválida"), 
    body("bloodOrParasitesInStool").optional().isString().trim().isLength({ max: 100 }),
    body("normalUrination").optional().isString().trim().isLength({ max: 100 }),
    body("urineFrequencyAndAmount").optional().isString().trim().isLength({ max: 100 }),
    body("urineColor").optional().isString().trim().isLength({ max: 50 }),
    body("painOrDifficultyUrinating").optional().isString().trim().isLength({ max: 100 }),
    body("cough").optional().isString().trim().isLength({ max: 200 }),
    body("sneezing").optional().isString().trim().isLength({ max: 200 }),
    body("breathingDifficulty").isBoolean().withMessage("Campo obligatorio"),
    body("itchingOrExcessiveLicking").isBoolean().withMessage("Campo obligatorio"),
    body("hairLossOrSkinLesions").optional().isString().trim().isLength({ max: 200 }),
    body("eyeDischarge").optional().isString().trim().isLength({ max: 100 }),
    body("earIssues").optional().isString().trim().isLength({ max: 200 }),
    body("feverSigns").isBoolean().withMessage("Campo obligatorio"),
    body("lethargyOrWeakness").isBoolean().withMessage("Campo obligatorio"),
    body("currentTreatment").optional().isString().trim().isLength({ max: 300 }),
    body("medications").optional().isString().trim().isLength({ max: 300 }),
    body("parvovirusVaccine").optional().isString().trim().isLength({ max: 100 }),
    body("parvovirusVaccineDate").optional().isISO8601(),
    body("quintupleSextupleVaccine").optional().isString().trim().isLength({ max: 100 }),
    body("quintupleSextupleVaccineDate").optional().isISO8601(),
    body("rabiesVaccineDogs").optional().isString().trim().isLength({ max: 100 }),
    body("rabiesVaccineDateDogs").optional().isISO8601(),
    body("dewormingDogs").optional().isString().trim().isLength({ max: 200 }),
    body("tripleQuintupleFelineVaccine").optional().isString().trim().isLength({ max: 100 }),
    body("tripleQuintupleFelineVaccineDate").optional().isISO8601(),
    body("rabiesVaccineCats").optional().isString().trim().isLength({ max: 100 }),
    body("rabiesVaccineDateCats").optional().isISO8601(),
    body("dewormingCats").optional().isString().trim().isLength({ max: 200 }),
    body("previousIllnesses").optional().isString().trim().isLength({ max: 300 }),
    body("previousSurgeries").optional().isString().trim().isLength({ max: 300 }),
    body("adverseReactions").optional().isString().trim().isLength({ max: 300 }),
    body("lastHeatOrBirth").optional().isString().trim().isLength({ max: 100 }),
    body("mounts").optional().isString().trim().isLength({ max: 100 }),
    body("temperature").notEmpty().withMessage("Temperatura obligatoria").isFloat({ min: 35, max: 42 }),
    body("lymphNodes").optional().isString().trim().isLength({ max: 100 }),
    body("heartRate").notEmpty().withMessage("FC obligatoria").isInt({ min: 0, max: 300 }),
    body("respiratoryRate").notEmpty().withMessage("FR obligatoria").isInt({ min: 0, max: 100 }),
    body("capillaryRefillTime").optional().isString().trim().isLength({ max: 50 }),
    body("weight").notEmpty().withMessage("Peso obligatorio").isFloat({ min: 0 }),
    body("integumentarySystem").optional().isString().trim().isLength({ max: 300 }),
    body("cardiovascularSystem").optional().isString().trim().isLength({ max: 300 }),
    body("ocularSystem").optional().isString().trim().isLength({ max: 300 }),
    body("respiratorySystem").optional().isString().trim().isLength({ max: 300 }),
    body("nervousSystem").optional().isString().trim().isLength({ max: 300 }),
    body("musculoskeletalSystem").optional().isString().trim().isLength({ max: 300 }),
    body("gastrointestinalSystem").optional().isString().trim().isLength({ max: 300 }),
    body("presumptiveDiagnosis").notEmpty().withMessage("Diagnóstico presuntivo obligatorio").isString().trim().isLength({ max: 300 }),
    body("definitiveDiagnosis").notEmpty().withMessage("Diagnóstico definitivo obligatorio").isString().trim().isLength({ max: 300 }),
    body("requestedTests").optional().isString().trim().isLength({ max: 300 }),
    body("treatmentPlan").notEmpty().withMessage("Plan de tratamiento obligatorio").isString().trim().isLength({ max: 500 }),
    body("cost").notEmpty().withMessage("Costo obligatorio").isFloat({ min: 0 }),
    body("discount").optional().isFloat({ min: 0 }),
  ],
  handleInputErrors,
  ConsultationController.createConsultation
);

router.get(
  "/patient/:patientId",
  param("patientId").isMongoId(),
  handleInputErrors,
  ConsultationController.getConsultationsByPatient
);

router.get(
  "/:id",
  param("id").isMongoId(),
  handleInputErrors,
  ConsultationController.getConsultationById
);

router.put(
  "/:id",
  checkCanCreate,
  [
    param("id").isMongoId(),
    body("reasonForVisit").optional().isString().trim().isLength({ max: 300 }),
    body("symptomOnset").optional().isString().trim().isLength({ max: 100 }),
    body("symptomEvolution").optional().isIn(['empeorado', 'mejorado', 'estable']),
    body("isNeutered").optional().isBoolean(),
    body("cohabitantAnimals").optional().isString().trim().isLength({ max: 100 }),
    body("contactWithStrays").optional().isString().trim().isLength({ max: 100 }),
    body("feeding").optional().isString().trim().isLength({ max: 200 }),
    body("appetite").optional().isIn(['Normal', 'Mucho', 'Poco', 'Nada']),
    body("vomiting").optional().isString().trim().isLength({ max: 200 }),
    body("bowelMovementFrequency").optional().isString().trim().isLength({ max: 100 }),
    body("stoolConsistency").optional().isIn(['normal', 'dura', 'pastosa', 'líquida']), 
    body("bloodOrParasitesInStool").optional().isString().trim().isLength({ max: 100 }),
    body("normalUrination").optional().isString().trim().isLength({ max: 100 }),
    body("urineFrequencyAndAmount").optional().isString().trim().isLength({ max: 100 }),
    body("urineColor").optional().isString().trim().isLength({ max: 50 }),
    body("painOrDifficultyUrinating").optional().isString().trim().isLength({ max: 100 }),
    body("cough").optional().isString().trim().isLength({ max: 200 }),
    body("sneezing").optional().isString().trim().isLength({ max: 200 }),
    body("breathingDifficulty").optional().isBoolean(),
    body("itchingOrExcessiveLicking").optional().isBoolean(),
    body("hairLossOrSkinLesions").optional().isString().trim().isLength({ max: 200 }),
    body("eyeDischarge").optional().isString().trim().isLength({ max: 100 }),
    body("earIssues").optional().isString().trim().isLength({ max: 200 }),
    body("feverSigns").optional().isBoolean(),
    body("lethargyOrWeakness").optional().isBoolean(),
    body("currentTreatment").optional().isString().trim().isLength({ max: 300 }),
    body("medications").optional().isString().trim().isLength({ max: 300 }),
    body("parvovirusVaccine").optional().isString().trim().isLength({ max: 100 }),
    body("parvovirusVaccineDate").optional().isISO8601(),
    body("quintupleSextupleVaccine").optional().isString().trim().isLength({ max: 100 }),
    body("quintupleSextupleVaccineDate").optional().isISO8601(),
    body("rabiesVaccineDogs").optional().isString().trim().isLength({ max: 100 }),
    body("rabiesVaccineDateDogs").optional().isISO8601(),
    body("dewormingDogs").optional().isString().trim().isLength({ max: 200 }),
    body("tripleQuintupleFelineVaccine").optional().isString().trim().isLength({ max: 100 }),
    body("tripleQuintupleFelineVaccineDate").optional().isISO8601(),
    body("rabiesVaccineCats").optional().isString().trim().isLength({ max: 100 }),
    body("rabiesVaccineDateCats").optional().isISO8601(),
    body("dewormingCats").optional().isString().trim().isLength({ max: 200 }),
    body("previousIllnesses").optional().isString().trim().isLength({ max: 300 }),
    body("previousSurgeries").optional().isString().trim().isLength({ max: 300 }),
    body("adverseReactions").optional().isString().trim().isLength({ max: 300 }),
    body("lastHeatOrBirth").optional().isString().trim().isLength({ max: 100 }),
    body("mounts").optional().isString().trim().isLength({ max: 100 }),
    body("temperature").optional().isFloat({ min: 35, max: 42 }),
    body("lymphNodes").optional().isString().trim().isLength({ max: 100 }),
    body("heartRate").optional().isInt({ min: 0, max: 300 }),
    body("respiratoryRate").optional().isInt({ min: 0, max: 100 }),
    body("capillaryRefillTime").optional().isString().trim().isLength({ max: 50 }),
    body("weight").optional().isFloat({ min: 0 }),
    body("integumentarySystem").optional().isString().trim().isLength({ max: 300 }),
    body("cardiovascularSystem").optional().isString().trim().isLength({ max: 300 }),
    body("ocularSystem").optional().isString().trim().isLength({ max: 300 }),
    body("respiratorySystem").optional().isString().trim().isLength({ max: 300 }),
    body("nervousSystem").optional().isString().trim().isLength({ max: 300 }),
    body("musculoskeletalSystem").optional().isString().trim().isLength({ max: 300 }),
    body("gastrointestinalSystem").optional().isString().trim().isLength({ max: 300 }),
    body("presumptiveDiagnosis").optional().isString().trim().isLength({ max: 300 }),
    body("definitiveDiagnosis").optional().isString().trim().isLength({ max: 300 }),
    body("requestedTests").optional().isString().trim().isLength({ max: 300 }),
    body("treatmentPlan").optional().isString().trim().isLength({ max: 500 }),
    body("cost").optional().isFloat({ min: 0 }),
    body("discount").optional().isFloat({ min: 0 }),
  ],
  handleInputErrors,
  ConsultationController.updateConsultation
);

router.delete(
  "/:id",
  checkCanCreate,
  param("id").isMongoId(),
  handleInputErrors,
  ConsultationController.deleteConsultation
);

export default router;