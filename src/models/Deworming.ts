// src/models/Deworming.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IDeworming extends Document {
  patientId: mongoose.Types.ObjectId;
  veterinarianId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId; // ← nuevo campo
  dewormingType: "Interna" | "Externa" | "Ambas";
  productName: string;
  dose: string;
  cost: number;
  applicationDate: Date;
  nextApplicationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DewormingSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "El ID del paciente es obligatorio"],
    },
    veterinarianId: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "El ID del veterinario es obligatorio"],
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: false, // opcional
    },
    dewormingType: {
      type: String,
      required: [true, "El tipo de desparasitación es obligatorio"],
      enum: {
        values: ["Interna", "Externa", "Ambas"],
        message: "Tipo inválido: debe ser Interna, Externa o Ambas",
      },
    },
    productName: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre del producto no puede exceder 100 caracteres"],
    },
    dose: {
      type: String,
      required: [true, "La dosis aplicada es obligatoria"],
      trim: true,
      maxlength: [50, "La dosis no puede exceder 50 caracteres"],
    },
    cost: {
      type: Number,
      required: [true, "El costo es obligatorio"],
      min: [0, "El costo no puede ser negativo"],
    },
    applicationDate: {
      type: Date,
      required: [true, "La fecha de aplicación es obligatoria"],
    },
    nextApplicationDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
DewormingSchema.index({ patientId: 1, applicationDate: -1 });
DewormingSchema.index({ veterinarianId: 1, applicationDate: -1 });

const Deworming = mongoose.model<IDeworming>("Deworming", DewormingSchema);
export default Deworming;