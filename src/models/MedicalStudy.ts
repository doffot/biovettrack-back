// src/models/MedicalStudy.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMedicalStudy extends Document {
  patientId: mongoose.Types.ObjectId;
  veterinarianId: mongoose.Types.ObjectId;
  professional: string; // Laboratorio o profesional externo
  studyType: string; // Hemograma, Radiografía, Ecografía, etc.
  pdfFile: string; // URL del PDF en Cloudinary
  presumptiveDiagnosis?: string; // Diagnóstico presuntivo
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalStudySchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "El estudio debe estar vinculado a un paciente"],
    },
    veterinarianId: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "El estudio debe estar vinculado a un veterinario"],
    },
    professional: {
      type: String,
      required: [true, "El nombre del profesional o laboratorio es obligatorio"],
      trim: true,
      maxlength: [100, "Máximo 100 caracteres"],
    },
    studyType: {
      type: String,
      required: [true, "El tipo de estudio es obligatorio"],
      trim: true,
      maxlength: [50, "Máximo 50 caracteres"],
    },
    pdfFile: {
      type: String,
      required: [true, "El archivo PDF es obligatorio"],
      trim: true,
    },
    presumptiveDiagnosis: {
      type: String,
      trim: true,
      maxlength: [500, "Máximo 500 caracteres"],
    },
    date: {
      type: Date,
      required: [true, "La fecha del estudio es obligatoria"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, "Máximo 300 caracteres"],
    },
  },
  {
    timestamps: true,
  }
);

MedicalStudySchema.index({ patientId: 1, date: -1 });
MedicalStudySchema.index({ veterinarianId: 1 });

const MedicalStudy = mongoose.model<IMedicalStudy>("MedicalStudy", MedicalStudySchema);
export default MedicalStudy;