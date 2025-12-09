// src/models/GroomingService.ts
import mongoose, { Schema, Document } from "mongoose";

// Tipos para el servicio
export type ServiceType = "Corte" | "Baño" | "Corte y Baño";
export type ServiceStatus = "Programado" | "En progreso" | "Completado" | "Cancelado";

// Interfaz IGroomingService (¡sin campos de pago!)
export interface IGroomingService extends Document {
  patientId: mongoose.Types.ObjectId;
  service: ServiceType;
  specifications: string;
  observations?: string;
  cost: number;
  status: ServiceStatus;
  groomer: mongoose.Types.ObjectId; 
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}


const GroomingServiceSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "El servicio debe estar asociado a un paciente"],
    },
    service: {
      type: String,
      required: [true, "El tipo de servicio es obligatorio"],
      enum: ["Corte", "Baño", "Corte y Baño"],
    },
    specifications: {
      type: String,
      required: [true, "Las especificaciones del servicio son obligatorias"],
      trim: true,
      maxlength: [300, "Las especificaciones no pueden exceder 300 caracteres"],
    },
    observations: {
      type: String,
      required: false,
      trim: true,
    },
    cost: {
      type: Number,
      required: [true, "El costo del servicio es obligatorio"],
      min: [0, "El costo no puede ser negativo"],
    },
    status: {
      type: String,
      enum: ["Programado", "En progreso", "Completado", "Cancelado"],
      default: "Programado",
      required: true,
    },
    groomer: {
      type: Schema.Types.ObjectId,
      ref: "Staff", 
      required: [true, "El groomer responsable es obligatorio"],
    },
    date: {
      type: Date,
      required: [true, "La fecha del servicio es obligatoria"],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);


const GroomingService = mongoose.model<IGroomingService>(
  "GroomingService",
  GroomingServiceSchema
);
export default GroomingService;