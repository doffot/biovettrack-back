// src/models/Payment.ts
import mongoose, { Schema, Document } from "mongoose";

export type PaymentStatus = "active" | "cancelled";
export type PaymentCurrency = "USD" | "Bs";

export interface IPayment extends Document {
  invoiceId: mongoose.Types.ObjectId;
  amount: number;
  currency: PaymentCurrency;
  exchangeRate: number;
  amountUSD: number;
  paymentMethod?: mongoose.Types.ObjectId;  // ← Ahora opcional
  reference?: string;
  status: PaymentStatus;
  isCredit: boolean;  // ← NUEVO
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledReason?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema(
  {
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: [true, "La factura es obligatoria"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "El monto es obligatorio"],
      min: [0.01, "El monto debe ser mayor a 0"],
    },
    currency: {
      type: String,
      required: [true, "La moneda es obligatoria"],
      enum: ["USD", "Bs"],
    },
    exchangeRate: {
      type: Number,
      required: [true, "La tasa de cambio es obligatoria"],
      min: [0.01, "La tasa debe ser mayor a 0"],
    },
    amountUSD: {
      type: Number,
      default: 0,
      min: [0, "El monto en USD no puede ser negativo"],
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
      required: false,  // ← CAMBIO: ahora opcional para pagos con crédito
    },
    reference: {
      type: String,
      trim: true,
      maxlength: [100, "La referencia no puede exceder 100 caracteres"],
    },
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
    isCredit: {
      type: Boolean,
      default: false,  // ← NUEVO: los pagos existentes serán false
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
    },
    cancelledReason: {
      type: String,
      trim: true,
      maxlength: [200, "La razón no puede exceder 200 caracteres"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "El creador es obligatorio"],
    },
  },
  {
    timestamps: true,
  }
);

// Calcular amountUSD antes de guardar
PaymentSchema.pre("save", function (next) {
  if (this.currency === "Bs" && this.exchangeRate > 0) {
    this.amountUSD = this.amount / this.exchangeRate;
  } else {
    this.amountUSD = this.amount;
  }
  next();
});

// Índices
PaymentSchema.index({ invoiceId: 1, status: 1 });
PaymentSchema.index({ createdBy: 1, createdAt: -1 });
PaymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
export default Payment;