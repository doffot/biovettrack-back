// src/models/InventoryMovement.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export type MovementType = "entrada" | "salida" | "ajuste";
export type MovementReason = 
  | "compra" 
  | "venta" 
  | "uso_clinico" 
  | "devolucion"
  | "vencimiento" 
  | "perdida"
  | "ajuste_manual"
  | "stock_inicial";

export interface IInventoryMovement extends Document {
  product: Types.ObjectId;
  type: MovementType;
  reason: MovementReason;
  
  quantityUnits: number;
  quantityDoses: number;
  
  stockAfterUnits: number;
  stockAfterDoses: number;
  
  // 👇 ACTUALIZADO: Agregar VeterinaryService y Treatment
  referenceType?: "Deworming" | "Vaccination" | "Consultation" | "Sale" | "Treatment" | "VeterinaryService";
  referenceId?: Types.ObjectId;
  
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
}

const InventoryMovementSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["entrada", "salida", "ajuste"],
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "compra",
        "venta",
        "uso_clinico",
        "devolucion",
        "vencimiento",
        "perdida",
        "ajuste_manual",
        "stock_inicial",
      ],
    },
    quantityUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantityDoses: {
      type: Number,
      default: 0,
      min: 0,
    },
    stockAfterUnits: {
      type: Number,
      required: true,
    },
    stockAfterDoses: {
      type: Number,
      required: true,
    },
    referenceType: {
      type: String,
      
      enum: ["Deworming", "Vaccination", "Consultation", "Sale", "Treatment", "VeterinaryService"],
    },
    referenceId: {
      type: Schema.Types.ObjectId,
    },
    notes: {
      type: String,
      maxlength: 200,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Índices para reportes
InventoryMovementSchema.index({ product: 1, createdAt: -1 });
InventoryMovementSchema.index({ type: 1, createdAt: -1 });
InventoryMovementSchema.index({ reason: 1 });
InventoryMovementSchema.index({ createdAt: -1 });
InventoryMovementSchema.index({ referenceType: 1, referenceId: 1 });

const InventoryMovement = mongoose.model<IInventoryMovement>(
  "InventoryMovement",
  InventoryMovementSchema
);
export default InventoryMovement;