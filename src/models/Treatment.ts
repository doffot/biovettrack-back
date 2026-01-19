// src/models/Treatment.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITreatment extends Document {
  patientId: mongoose.Types.ObjectId;
  veterinarianId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  treatmentType: "Antibiótico" | "Antiinflamatorio" | "Analgésico" | "Suplemento" | "Otro";
  treatmentTypeOther?: string; 
  productName: string;
  dose: string;
  frequency: string;
  duration: string;
  route: "Oral" | "Inyectable" | "Tópica" | "Intravenosa" | "Subcutánea" | "Otro";
  routeOther?: string; 
  cost: number;
  startDate: Date;
  endDate?: Date;
  observations?: string;
  status: "Activo" | "Completado" | "Suspendido";
  createdAt: Date;
  updatedAt: Date;
}

const TreatmentSchema = new Schema(
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
      required: false,
    },
    treatmentType: {
      type: String,
      required: [true, "El tipo de tratamiento es obligatorio"],
      enum: {
        values: ["Antibiótico", "Antiinflamatorio", "Analgésico", "Suplemento", "Otro"],
        message: "Tipo inválido",
      },
    },
   
    treatmentTypeOther: {
      type: String,
      trim: true,
      maxlength: [100, "El tipo personalizado no puede exceder 100 caracteres"],
      required: function(this: ITreatment) {
        return this.treatmentType === "Otro";
      },
    },
    productName: {
      type: String,
      required: [true, "El nombre del producto/medicamento es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },
    dose: {
      type: String,
      required: [true, "La dosis es obligatoria"],
      trim: true,
      maxlength: [100, "La dosis no puede exceder 100 caracteres"],
    },
    frequency: {
      type: String,
      required: [true, "La frecuencia es obligatoria"],
      trim: true,
      maxlength: [100, "La frecuencia no puede exceder 100 caracteres"],
    },
    duration: {
      type: String,
      required: [true, "La duración del tratamiento es obligatoria"],
      trim: true,
      maxlength: [100, "La duración no puede exceder 100 caracteres"],
    },
    route: {
      type: String,
      required: [true, "La vía de administración es obligatoria"],
      enum: {
        values: ["Oral", "Inyectable", "Tópica", "Intravenosa", "Subcutánea", "Otro"],
        message: "Vía de administración inválida",
      },
    },
    
    routeOther: {
      type: String,
      trim: true,
      maxlength: [100, "La vía personalizada no puede exceder 100 caracteres"],
      required: function(this: ITreatment) {
        return this.route === "Otro";
      },
    },
    cost: {
      type: Number,
      required: [true, "El costo es obligatorio"],
      min: [0, "El costo no puede ser negativo"],
    },
    startDate: {
      type: Date,
      required: [true, "La fecha de inicio es obligatoria"],
    },
    endDate: {
      type: Date,
    },
    observations: {
      type: String,
      trim: true,
      maxlength: [500, "Las observaciones no pueden exceder 500 caracteres"],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["Activo", "Completado", "Suspendido"],
        message: "Estado inválido",
      },
      default: "Activo",
    },
  },
  {
    timestamps: true,
  }
);

// Índices
TreatmentSchema.index({ patientId: 1, startDate: -1 });
TreatmentSchema.index({ veterinarianId: 1, startDate: -1 });
TreatmentSchema.index({ status: 1 });

const Treatment = mongoose.model<ITreatment>("Treatment", TreatmentSchema);
export default Treatment;