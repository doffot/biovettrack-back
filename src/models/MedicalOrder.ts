// src/models/MedicalOrder.ts
import mongoose, { Schema, Document } from "mongoose";

// Tipos
export type StudyType = 
  | 'ecografia' 
  | 'radiografia' 
  | 'laboratorio' 
  | 'tomografia' 
  | 'electrocardiograma'
  | 'endoscopia'
  | 'citologia'
  | 'biopsia'
  | 'otro';

export type StudyPriority = 'normal' | 'urgente';

// Interfaz para cada estudio
export interface IStudy {
  type: StudyType;
  name: string;
  region?: string;
  reason: string;
  priority: StudyPriority;
  instructions?: string;
}

// Interfaz principal
export interface IMedicalOrder extends Document {
  patientId: mongoose.Types.ObjectId;
  veterinarianId: mongoose.Types.ObjectId;
  consultationId?: mongoose.Types.ObjectId;
  issueDate: Date;
  studies: IStudy[];
  clinicalHistory?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-esquema para estudios
const StudySchema = new Schema(
  {
    type: {
      type: String,
      required: [true, "El tipo de estudio es obligatorio"],
      enum: {
        values: [
          'ecografia',
          'radiografia',
          'laboratorio',
          'tomografia',
          'electrocardiograma',
          'endoscopia',
          'citologia',
          'biopsia',
          'otro'
        ],
        message: "Tipo de estudio no válido",
      },
    },
    name: {
      type: String,
      required: [true, "El nombre del estudio es obligatorio"],
      trim: true,
      maxlength: [150, "Máximo 150 caracteres"],
    },
    region: {
      type: String,
      trim: true,
      maxlength: [100, "Máximo 100 caracteres"],
    },
    reason: {
      type: String,
      required: [true, "El motivo es obligatorio"],
      trim: true,
      maxlength: [300, "Máximo 300 caracteres"],
    },
    priority: {
      type: String,
      required: [true, "La prioridad es obligatoria"],
      enum: {
        values: ['normal', 'urgente'],
        message: "Debe ser 'normal' o 'urgente'",
      },
      default: 'normal',
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [300, "Máximo 300 caracteres"],
    },
  },
  { _id: false }
);

// Esquema principal
const MedicalOrderSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "La orden debe estar vinculada a un paciente"],
    },
    veterinarianId: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "La orden debe estar vinculada a un veterinario"],
    },
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: "Consultation",
      required: false,
    },
    issueDate: {
      type: Date,
      required: [true, "La fecha de emisión es obligatoria"],
      default: Date.now,
    },
    studies: {
      type: [StudySchema],
      required: [true, "Debe incluir al menos un estudio"],
      validate: {
        validator: function (v: IStudy[]) {
          return v && v.length > 0;
        },
        message: "La orden debe tener al menos un estudio",
      },
    },
    clinicalHistory: {
      type: String,
      trim: true,
      maxlength: [1000, "Máximo 1000 caracteres"],
    },
  },
  {
    timestamps: true,
  }
);

// Índices
MedicalOrderSchema.index({ patientId: 1, issueDate: -1 });
MedicalOrderSchema.index({ veterinarianId: 1 });
MedicalOrderSchema.index({ consultationId: 1 });

const MedicalOrder = mongoose.model<IMedicalOrder>("MedicalOrder", MedicalOrderSchema);
export default MedicalOrder;