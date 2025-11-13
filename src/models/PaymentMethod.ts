// models/PaymentMethod.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentMethod extends Document {
  name: string;
  description?: string;
  currency: string;
  paymentMode: string;
  requiresReference: boolean;
  isActive: boolean;
  veterinarian: mongoose.Types.ObjectId; // ✅ Dueño del método de pago
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del método de pago es obligatorio"],
      trim: true
      // ❌ QUITAMOS unique: true - cada vet tiene sus métodos
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "La descripción no puede exceder 200 caracteres"]
    },
    currency: {
      type: String,
      required: [true, "La moneda es obligatoria"],
      trim: true
    },
    paymentMode: {
      type: String,
      required: [true, "El modo de pago es obligatorio"],
      trim: true
    },
    requiresReference: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    veterinarian: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "El veterinario dueño es obligatorio"]
    }
  },
  {
    timestamps: true
  }
);

// ✅ Índice compuesto - mismo nombre pero diferente veterinario
PaymentMethodSchema.index({ name: 1, veterinarian: 1 }, { unique: true });

export default mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);