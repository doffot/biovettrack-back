// src/models/Consultation.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IConsultation extends Document {
  patientId: mongoose.Types.ObjectId;
  veterinarianId: mongoose.Types.ObjectId;
  consultationDate: Date;
  isDraft: boolean;
  reasonForVisit?: string;
  symptomOnset?: string;
  symptomEvolution?: "empeorado" | "mejorado" | "estable";
  isNeutered?: boolean;
  cohabitantAnimals?: string;
  contactWithStrays?: string;
  feeding?: string;
  appetite?: "Normal" | "Mucho" | "Poco" | "Nada";
  vomiting?: string;
  bowelMovementFrequency?: string;
  stoolConsistency?: "normal" | "dura" | "pastosa" | "líquida";
  bloodOrParasitesInStool?: string;
  normalUrination?: string;
  urineFrequencyAndAmount?: string;
  urineColor?: string;
  painOrDifficultyUrinating?: string;
  cough?: string;
  sneezing?: string;
  breathingDifficulty?: boolean;
  itchingOrExcessiveLicking?: boolean;
  hairLossOrSkinLesions?: string;
  eyeDischarge?: string;
  earIssues?: string;
  feverSigns?: boolean;
  lethargyOrWeakness?: boolean;
  currentTreatment?: string;
  medications?: string;
  previousIllnesses?: string;
  previousSurgeries?: string;
  adverseReactions?: string;
  lastHeatOrBirth?: string;
  mounts?: string;
  temperature?: number;
  lymphNodes?: string;
  heartRate?: number;
  respiratoryRate?: number;
  capillaryRefillTime?: string;
  weight?: number;
  integumentarySystem?: string;
  cardiovascularSystem?: string;
  ocularSystem?: string;
  respiratorySystem?: string;
  nervousSystem?: string;
  musculoskeletalSystem?: string;
  gastrointestinalSystem?: string;
  presumptiveDiagnosis?: string;
  definitiveDiagnosis?: string;
  requestedTests?: string;
  treatmentPlan?: string;
  cost?: number;
  discount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "La consulta debe estar vinculada a un paciente"],
    },
    veterinarianId: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "La consulta debe estar vinculada a un veterinario"],
    },
    consultationDate: {
      type: Date,
      required: [true, "La fecha de consulta es obligatoria"],
    },
    isDraft: {
      type: Boolean,
      default: true,
    },
    reasonForVisit: {
      type: String,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
      trim: true,
      maxlength: 300,
    },
    symptomOnset: {
      type: String,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
      trim: true,
      maxlength: 100,
    },
    symptomEvolution: {
      type: String,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
      enum: ["empeorado", "mejorado", "estable"],
    },
    isNeutered: {
      type: Boolean,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
    },
    cohabitantAnimals: { type: String, trim: true, maxlength: 100 },
    contactWithStrays: { type: String, trim: true, maxlength: 100 },
    feeding: { type: String, trim: true, maxlength: 200 },
    appetite: {
      type: String,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
      enum: ["Normal", "Mucho", "Poco", "Nada"],
    },
    vomiting: { type: String, trim: true, maxlength: 200 },
    bowelMovementFrequency: { type: String, trim: true, maxlength: 100 },
    stoolConsistency: {
      type: String,
      enum: ["normal", "dura", "pastosa", "líquida"],
    },
    bloodOrParasitesInStool: { type: String, trim: true, maxlength: 100 },
    normalUrination: { type: String, trim: true, maxlength: 100 },
    urineFrequencyAndAmount: { type: String, trim: true, maxlength: 100 },
    urineColor: { type: String, trim: true, maxlength: 50 },
    painOrDifficultyUrinating: { type: String, trim: true, maxlength: 100 },
    cough: { type: String, trim: true, maxlength: 200 },
    sneezing: { type: String, trim: true, maxlength: 200 },
    breathingDifficulty: {
      type: Boolean,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
    },
    itchingOrExcessiveLicking: {
      type: Boolean,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
    },
    hairLossOrSkinLesions: { type: String, trim: true, maxlength: 200 },
    eyeDischarge: { type: String, trim: true, maxlength: 100 },
    earIssues: { type: String, trim: true, maxlength: 200 },
    feverSigns: {
      type: Boolean,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
    },
    lethargyOrWeakness: {
      type: Boolean,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
    },
    currentTreatment: { type: String, trim: true, maxlength: 300 },
    medications: { type: String, trim: true, maxlength: 300 },
    previousIllnesses: { type: String, trim: true, maxlength: 300 },
    previousSurgeries: { type: String, trim: true, maxlength: 300 },
    adverseReactions: { type: String, trim: true, maxlength: 300 },
    lastHeatOrBirth: { type: String, trim: true, maxlength: 100 },
    mounts: { type: String, trim: true, maxlength: 100 },
    temperature: {
      type: Number,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
      min: 35,
      max: 42,
    },
    lymphNodes: { type: String, trim: true, maxlength: 100 },
    heartRate: {
      type: Number,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
      min: 0,
      max: 300,
    },
    respiratoryRate: {
      type: Number,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
      min: 0,
      max: 100,
    },
    capillaryRefillTime: { type: String, trim: true, maxlength: 50 },
    weight: {
      type: Number,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
      min: 0,
    },
    integumentarySystem: { type: String, trim: true, maxlength: 300 },
    cardiovascularSystem: { type: String, trim: true, maxlength: 300 },
    ocularSystem: { type: String, trim: true, maxlength: 300 },
    respiratorySystem: { type: String, trim: true, maxlength: 300 },
    nervousSystem: { type: String, trim: true, maxlength: 300 },
    musculoskeletalSystem: { type: String, trim: true, maxlength: 300 },
    gastrointestinalSystem: { type: String, trim: true, maxlength: 300 },
    presumptiveDiagnosis: {
      type: String,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
      trim: true,
      maxlength: 300,
    },
    definitiveDiagnosis: {
      type: String,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
      trim: true,
      maxlength: 300,
    },
    requestedTests: { type: String, trim: true, maxlength: 300 },
    treatmentPlan: {
      type: String,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
      trim: true,
      maxlength: 500,
    },
    cost: {
      type: Number,
      required: function (this: IConsultation) {
        return !this.isDraft;
      },
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "El descuento no puede ser negativo"],
    },
  },
  {
    timestamps: true,
  }
);

ConsultationSchema.index({ patientId: 1, consultationDate: -1 });
ConsultationSchema.index({ veterinarianId: 1 });
ConsultationSchema.index({ patientId: 1, isDraft: 1 });

const Consultation = mongoose.model<IConsultation>(
  "Consultation",
  ConsultationSchema
);
export default Consultation;