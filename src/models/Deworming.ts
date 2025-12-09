// src/models/Deworming.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IDeworming extends Document {
  patientId: mongoose.Types.ObjectId; // Paciente tratado
  veterinarianId: mongoose.Types.ObjectId; // Veterinario que aplica
  applicationDate: Date; // Fecha de aplicación
  nextApplicationDate?: Date; // Próxima fecha
  dewormingType: string; // Tipo (Interna, Externa, Ambas)
  productName: string; // Nombre del producto
  dose: string; // Dosis aplicada
  cost: number; // 👈 Costo obligatorio
  createdAt: Date;
  updatedAt: Date;
}

const DewormingSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "La desparasitación debe estar vinculada a un paciente"],
    },
    veterinarianId: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "La desparasitación debe estar vinculada a un veterinario"],
    },
    applicationDate: {
      type: Date,
      required: [true, "La fecha de aplicación es obligatoria"],
    },
    nextApplicationDate: {
      type: Date,
    },
    dewormingType: {
      type: String,
      required: [true, "El tipo de desparasitación es obligatorio"],
      enum: ["Interna", "Externa", "Ambas"],
      message: "Tipo inválido: debe ser Interna, Externa o Ambas",
    },
    productName: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"],
      trim: true,
      maxlength: [100, "Máximo 100 caracteres"],
    },
    dose: {
      type: String,
      required: [true, "La dosis aplicada es obligatoria"],
      trim: true,
      maxlength: [50, "Máximo 50 caracteres"],
    },
    cost: {
      type: Number,
      required: [true, "El costo es obligatorio"],
      min: [0, "El costo no puede ser negativo"],
    },
  },
  {
    timestamps: true,
  }
);

// Índices
DewormingSchema.index({ patientId: 1, applicationDate: -1 });
DewormingSchema.index({ veterinarianId: 1 });

const Deworming = mongoose.model<IDeworming>("Deworming", DewormingSchema);
export default Deworming;