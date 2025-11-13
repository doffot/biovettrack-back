import mongoose, { Schema, Document } from "mongoose";

// Tipos para el servicio
export type ServiceType = "Corte" | "Baño" | "Corte y Baño";
export type ServiceStatus = "Programado" | "En progreso" | "Completado" | "Cancelado";
export type PaymentStatus = "Pendiente" | "Pagado" | "Parcial" | "Cancelado";

// Interfaz IGroomingService
export interface IGroomingService extends Document {
  patientId: mongoose.Types.ObjectId;
  service: ServiceType;
  specifications: string;
  observations?: string;
  cost: number;
  paymentMethod: mongoose.Types.ObjectId; // Referencia al método de pago
  paymentReference?: string; // Número de referencia para transferencias
  status: ServiceStatus;
  groomer: mongoose.Types.ObjectId; // Veterinario responsable
  paymentStatus: PaymentStatus;
  amountPaid: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Esquema
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
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
      required: [true, "El método de pago es obligatorio"]
    },
    paymentReference: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["Programado", "En progreso", "Completado", "Cancelado"],
      default: "Programado",
      required: true
    },
    groomer: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "El groomer responsable es obligatorio"]
    },
    paymentStatus: {
      type: String,
      enum: ["Pendiente", "Pagado", "Parcial", "Cancelado"],
      default: "Pendiente",
      required: true
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, "El monto pagado no puede ser negativo"]
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

// Modelo
const GroomingService = mongoose.model<IGroomingService>(
  "GroomingService",
  GroomingServiceSchema
);
export default GroomingService;