import mongoose, { Schema, Document, Types } from "mongoose";
import { IVeterinarian } from "./Veterinarian";


export interface IOwner extends Document {
  name: string;
  contact: string;
  email?: string;
  address?: string;
  nationalId?: string; 
  createdAt: Date;
  updatedAt: Date;
  veterinarian?: Types.ObjectId | IVeterinarian;
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
    nationalId: {
      type: String,
      required: false, // ← Puedes cambiar a `true` si es obligatorio
      trim: true,
      unique: true, 
     
     
    },
    veterinarian: {
      type: Types.ObjectId,
      ref: "Veterinarian"
    }
  },
  {
    timestamps: true
  }
);

// Virtual para mascotas
OwnerSchema.virtual("pets", {
  ref: "Patient",
  localField: "_id",
  foreignField: "ownerId",
  justOne: false
});


OwnerSchema.set("toJSON", { virtuals: true });
OwnerSchema.set("toObject", { virtuals: true });




const Owner = mongoose.model<IOwner>("Owner", OwnerSchema);
export default Owner;