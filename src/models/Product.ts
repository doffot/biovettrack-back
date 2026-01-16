// src/models/Product.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export type ProductCategory = "vacuna" | "desparasitante" | "medicamento" | "alimento" | "accesorio" | "otro";

export interface IProduct extends Document {
  name: string;
  description?: string;
  category: ProductCategory;
  
  // Precios
  salePrice: number;
  salePricePerDose?: number;
  costPrice?: number;
  
  // Unidades
  unit: string;
  doseUnit: string;
  dosesPerUnit: number;
  
  // Comportamiento
  divisible: boolean;
  
  // Estado
  active: boolean;
  veterinarian: Types.ObjectId; // Dueño del producto
  
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
      // ⚠️ unique: true REMOVIDO → ya no es único global
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "La descripción no puede exceder 200 caracteres"],
    },
    category: {
      type: String,
      required: [true, "La categoría es obligatoria"],
      enum: {
        values: ["vacuna", "desparasitante", "medicamento", "alimento", "accesorio", "otro"],
        message: "Categoría no válida",
      },
    },
    salePrice: {
      type: Number,
      required: [true, "El precio de venta es obligatorio"],
      min: [0, "El precio no puede ser negativo"],
    },
    salePricePerDose: {
      type: Number,
      min: [0, "El precio por dosis debe ser positivo"],
    },
    costPrice: {
      type: Number,
      min: [0, "El costo no puede ser negativo"],
    },
    unit: {
      type: String,
      required: [true, "La unidad física es obligatoria"],
      trim: true,
      maxlength: [30, "La unidad no puede exceder 30 caracteres"],
    },
    doseUnit: {
      type: String,
      required: [true, "La unidad de dosis es obligatoria"],
      trim: true,
      maxlength: [10, "La unidad de dosis no puede exceder 10 caracteres"],
      default: "dosis",
    },
    dosesPerUnit: {
      type: Number,
      required: [true, "Las dosis por unidad son obligatorias"],
      min: [1, "Debe ser al menos 1"],
      default: 1,
    },
    divisible: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    veterinarian: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "El producto debe pertenecer a un veterinario"],
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Índices actualizados
ProductSchema.index({ name: 1, veterinarian: 1 }, { unique: true }); // Nombre único por veterinario
ProductSchema.index({ category: 1 });
ProductSchema.index({ veterinarian: 1 });

const Product = mongoose.model<IProduct>("Product", ProductSchema);
export default Product;