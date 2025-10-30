import mongoose, { Schema, Document, PopulatedDoc, Types } from "mongoose";
import { IVeterinarian } from "./Veterinarian";

/**
 * Interfaz para el documento Owner
 */
export interface IOwner extends Document {
  name: string;
  contact: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
 veterinarian?: mongoose.Types.ObjectId | IVeterinarian; 
}

const OwnerSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del dueño es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"]
    },
    contact: {
      type: String,
      required: [true, "El contacto (teléfono) es obligatorio"],
      trim: true,
      match: [
        /^[\+]?[0-9\s\-\(\)]{10,}$/,
        "Por favor ingrese un número de contacto válido"
      ]
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email inválido"],
      sparse: true
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "La dirección no puede exceder 200 caracteres"]
    },
    veterinarian: {
      type: Types.ObjectId,
      ref: "Veterinarian",
    }
  },
  {
    timestamps: true
  }
);

OwnerSchema.virtual("pets", {
  ref: "Patient", // Nombre del modelo relacionado
  localField: "_id", // Campo en Owner
  foreignField: "ownerId", // Campo en Patient que referencia a Owner
  justOne: false // Queremos un array de mascotas
});

OwnerSchema.set("toJSON", { virtuals: true });
OwnerSchema.set("toObject", { virtuals: true });

/**
 * Índices para búsquedas eficientes
 */
OwnerSchema.index({ name: "text", contact: "text" }); // Búsqueda global
OwnerSchema.index({ email: 1 }, { unique: true, sparse: true }); // Único si existe

const Owner = mongoose.model<IOwner>("Owner", OwnerSchema);
export default Owner;