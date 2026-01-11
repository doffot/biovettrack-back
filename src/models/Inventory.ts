// src/models/Inventory.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInventory extends Document {
  product: Types.ObjectId;
  veterinarian: Types.ObjectId;
  stockUnits: number;      // Unidades completas
  stockDoses: number;      // Fracciones sueltas
  lastMovement: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true, // Un registro de inventario por producto
    },
    veterinarian: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: true,
    },
    stockUnits: {
      type: Number,
      default: 0,
      min: [0, "El stock no puede ser negativo"],
    },
    stockDoses: {
      type: Number,
      default: 0,
      min: [0, "Las dosis no pueden ser negativas"],
    },
    lastMovement: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

InventorySchema.index({ product: 1 });
InventorySchema.index({ veterinarian: 1 });
InventorySchema.index({ stockUnits: 1 });

const Inventory = mongoose.model<IInventory>("Inventory", InventorySchema);
export default Inventory;