import mongoose, { Schema, Document } from "mongoose";

// Tipos para el servicio
export type ServiceType = "Corte" | "Baño" | "Corte y Baño";
export type PaymentType = "Efectivo" | "Pago Movil" | "Zelle" | "Otro";
export type CurrencyType = "Bolivares" | "Dolares" | "Ambos";

// Interfaz IGroomingService
export interface IGroomingService extends Document {
  patientId: mongoose.Types.ObjectId; // Referencia al paciente que recibe el servicio
  service: ServiceType; // 'Corte' o 'Baño' o 'Corte y Baño'
  specifications: string; // Ej: "Corte de raza", "Baño con shampoo medicado"
  observations?: string; // Observaciones adicionales del groomer
  cost: number; // Costo del servicio
  paymentType: PaymentType; // 'Efectivo', 'Pago Movil', 'Zelle', 'Otro'
  exchangeRate?: number; // Tasa de cambio (si el pago es en Bs o involucra Bs)
  date: Date; // Fecha del servicio
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
    paymentType: {
      type: String,
      required: [true, "El tipo de pago es obligatorio"], // CORREGIDO: Valores de enum actualizados para incluir Pago Movil y Zelle
      enum: ["Efectivo", "Pago Movil", "Zelle", "Otro"],
    },
    exchangeRate: {
      type: Number,
      required: false,
      min: [0, "La tasa de cambio no puede ser negativa"],
    },
    date: {
      type: Date,
      required: [true, "La fecha del servicio es obligatoria"],
      default: Date.now, // Valor por defecto si no se especifica
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
