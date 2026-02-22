// models/VeterinaryClinic.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { IVeterinarian } from "./Veterinarian";

export interface ISocialMedia {
  platform: string;
  url: string;
}

export interface IVeterinaryClinic extends Document {
  name: string;
  rif?: string;
  logo?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  socialMedia?: ISocialMedia[];
  businessHours?: string;
  services?: string[];
  description?: string;
  veterinarian: Types.ObjectId | IVeterinarian;
  createdAt: Date;
  updatedAt: Date;
}

const SocialMediaSchema: Schema = new Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: [
        "facebook",
        "instagram",
        "twitter",
        "tiktok",
        "youtube",
        "linkedin",
        "otro"
      ],
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true,
      match: [
        /^https?:\/\/.+/,
        "La URL debe comenzar con http:// o https://"
      ]
    }
  },
  { _id: false }
);

const VeterinaryClinicSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre de la clínica es obligatorio"],
      trim: true,
      maxlength: [150, "El nombre no puede exceder 150 caracteres"]
    },
    rif: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [20, "El RIF no puede exceder 20 caracteres"]
    },
    logo: {
      type: String,
      trim: true,
      default: null
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^[\+]?[0-9\s\-\(\)]{7,}$/,
        "Por favor ingrese un número de teléfono válido"
      ]
    },
    whatsapp: {
      type: String,
      trim: true,
      match: [
        /^[\+]?[0-9]{10,15}$/,
        "Por favor ingrese un número de WhatsApp válido (solo números, puede incluir +)"
      ]
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email inválido"]
    },
    address: {
      type: String,
      trim: true,
      maxlength: [250, "La dirección no puede exceder 250 caracteres"]
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, "La ciudad no puede exceder 100 caracteres"]
    },
    country: {
      type: String,
      trim: true,
      default: "Venezuela",
      maxlength: [100, "El país no puede exceder 100 caracteres"]
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: [20, "El código postal no puede exceder 20 caracteres"]
    },
    website: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/.+/,
        "La URL del sitio web debe comenzar con http:// o https://"
      ]
    },
    socialMedia: {
      type: [SocialMediaSchema],
      default: []
    },
    businessHours: {
      type: String,
      trim: true,
      maxlength: [500, "El horario no puede exceder 500 caracteres"],
      default: "Lun-Vie: 9:00 AM - 6:00 PM"
    },
    services: {
      type: [String],
      default: []
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "La descripción no puede exceder 1000 caracteres"]
    },
    veterinarian: {
      type: Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "El veterinario propietario es obligatorio"],
      unique: true
    }
  },
  {
    timestamps: true
  }
);

// Índices
VeterinaryClinicSchema.index({ veterinarian: 1 });

// Configuración JSON
VeterinaryClinicSchema.set("toJSON", { virtuals: true });
VeterinaryClinicSchema.set("toObject", { virtuals: true });

const VeterinaryClinic = mongoose.model<IVeterinaryClinic>(
  "VeterinaryClinic",
  VeterinaryClinicSchema
);

export default VeterinaryClinic;