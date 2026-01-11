// src/models/Purchase.ts
import mongoose, { Schema, Document, Types } from "mongoose";

// =============== PURCHASE ITEM ===============
export interface IPurchaseItem extends Document {
  product: Types.ObjectId;
  productName: string; // Copia para reportes (en caso de que el producto se edite después)
  quantity: number;    // Unidades completas
  unitCost: number;    // Costo por unidad
  totalCost: number;   // quantity * unitCost
}

const PurchaseItemSchema = new Schema<IPurchaseItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: {
    type: String,
    required: true,
    maxlength: 100,
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, "La cantidad debe ser positiva"],
  },
  unitCost: {
    type: Number,
    required: true,
    min: [0, "El costo no puede ser negativo"],
  },
  totalCost: {
    type: Number,
    required: true,
    min: [0, "El costo total no puede ser negativo"],
  },
});

// =============== PURCHASE ===============
export type PurchaseStatus = "completada" | "pendiente" | "cancelada";

export interface IPurchase extends Document {
  provider?: string;
  totalAmount: number;
  paymentMethod: string; // "efectivo", "transferencia", etc.
  status: PurchaseStatus;
  items: Types.ObjectId[]; // Referencias a PurchaseItem
  notes?: string;
  veterinarian: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    provider: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "El monto total no puede ser negativo"],
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    status: {
      type: String,
      enum: ["completada", "pendiente", "cancelada"],
      default: "completada",
    },
    items: [{
      type: Schema.Types.ObjectId,
      ref: "PurchaseItem",
      required: true,
    }],
    notes: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    veterinarian: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
PurchaseSchema.index({ veterinarian: 1 });
PurchaseSchema.index({ createdAt: -1 });
PurchaseSchema.index({ status: 1 });

const PurchaseItem = mongoose.model<IPurchaseItem>("PurchaseItem", PurchaseItemSchema);
const Purchase = mongoose.model<IPurchase>("Purchase", PurchaseSchema);

export { Purchase, PurchaseItem };