// src/models/Recipe.ts
import mongoose, { Schema, Document } from "mongoose";

// Tipos
export type MedicationSource = 'veterinario' | 'farmacia';

// Interfaz para cada medicamento
export interface IMedication {
  name: string;
  presentation: string;
  source: MedicationSource;
  instructions: string;
  quantity?: string;
}

// Interfaz principal
export interface IRecipe extends Document {
  patientId: mongoose.Types.ObjectId;
  veterinarianId: mongoose.Types.ObjectId;
  consultationId?: mongoose.Types.ObjectId;
  issueDate: Date;
  medications: IMedication[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-esquema para medicamentos
const MedicationSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del medicamento es obligatorio"],
      trim: true,
      maxlength: [100, "Máximo 100 caracteres"],
    },
    presentation: {
      type: String,
      required: [true, "La presentación es obligatoria"],
      trim: true,
      maxlength: [100, "Máximo 100 caracteres"],
    },
    source: {
      type: String,
      required: [true, "El tipo de uso es obligatorio"],
      enum: {
        values: ['veterinario', 'farmacia'],
        message: "Debe ser 'veterinario' o 'farmacia'",
      },
    },
    instructions: {
      type: String,
      required: [true, "El modo de uso es obligatorio"],
      trim: true,
      maxlength: [300, "Máximo 300 caracteres"],
    },
    quantity: {
      type: String,
      trim: true,
      maxlength: [50, "Máximo 50 caracteres"],
    },
  },
  { _id: false }
);

// Esquema principal
const RecipeSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "La receta debe estar vinculada a un paciente"],
    },
    veterinarianId: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "La receta debe estar vinculada a un veterinario"],
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
    medications: {
      type: [MedicationSchema],
      required: [true, "Debe incluir al menos un medicamento"],
      validate: {
        validator: function (v: IMedication[]) {
          return v && v.length > 0;
        },
        message: "La receta debe tener al menos un medicamento",
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Máximo 500 caracteres"],
    },
  },
  {
    timestamps: true,
  }
);

// Índices para búsquedas eficientes
RecipeSchema.index({ patientId: 1, issueDate: -1 });
RecipeSchema.index({ veterinarianId: 1 });
RecipeSchema.index({ consultationId: 1 });

const Recipe = mongoose.model<IRecipe>("Recipe", RecipeSchema);
export default Recipe;