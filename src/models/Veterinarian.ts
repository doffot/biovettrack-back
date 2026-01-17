import mongoose, { Schema, Document } from 'mongoose';

const estadosVenezuela = [
  "Amazonas",
  "Anzoátegui",
  "Apure",
  "Aragua",
  "Barinas",
  "Bolívar",
  "Carabobo",
  "Cojedes",
  "Delta Amacuro",
  "Distrito Capital",
  "Falcón",
  "Guárico",
  "Lara",
  "Mérida",
  "Miranda",
  "Monagas",
  "Nueva Esparta",
  "Portuguesa",
  "Sucre",
  "Táchira",
  "Trujillo",
  "Vargas",
  "Yaracuy",
  "Zulia"
] as const;

export type EstadoVenezuela = typeof estadosVenezuela[number];
export type PlanType = 'trial' | 'basic' | 'premium';

export interface IVeterinarian extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  lastName: string;
  email: string;
  password: string;
  whatsapp: string;
  ci: string;
  cmv: string;
  estado: EstadoVenezuela;
  runsai?: string;
  msds?: string;
  somevepa?: string;
  confirmed: boolean;
  isLegacyUser: boolean;
  planType: PlanType;
  trialStartedAt?: Date;
  trialEndedAt?: Date;
  isActive: boolean;
  patientCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const VeterinarianSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [50, 'El nombre no puede exceder los 50 caracteres']
    },
    lastName: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true,
      maxlength: [50, 'El apellido no puede exceder los 50 caracteres']
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Formato de email inválido'],
      maxlength: [100, 'El correo no puede tener más de 100 caracteres']
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    whatsapp: {
      type: String,
      required: [true, 'El número de WhatsApp es obligatorio'],
      trim: true,
      match: [/^\+?[1-9]\d{6,14}$/, 'Debe ser un número internacional válido (ej: +584121234567)'],
      maxlength: [20, 'El número de WhatsApp no puede tener más de 20 caracteres']
    },
    ci: {
      type: String,
      required: [true, 'La cédula de identidad (CI) es obligatoria'],
      unique: true,
      trim: true,
      maxlength: [20, 'El CI no puede tener más de 20 caracteres']
    },
    cmv: {
      type: String,
      required: [true, 'El número de colegio (CMV) es obligatorio'],
      unique: true,
      trim: true,
      maxlength: [20, 'El CMV no puede tener más de 20 caracteres']
    },
    estado: {
      type: String,
      required: [true, 'El estado es obligatorio'],
      enum: {
        values: estadosVenezuela,
        message: 'El estado ingresado no es válido'
      }
    },
    runsai: {
      type: String,
      trim: true,
      maxlength: [30, 'El RUNSAI no puede tener más de 30 caracteres'],
      default: null
    },
    msds: {
      type: String,
      trim: true,
      maxlength: [100, 'El MSDS no puede tener más de 100 caracteres'],
      default: null
    },
    somevepa: {
      type: String,
      trim: true,
      maxlength: [100, 'El SOMEVEPA no puede tener más de 100 caracteres'],
      default: null
    },
    confirmed: {
      type: Boolean,
      default: false
    },
    isLegacyUser: {
      type: Boolean,
      default: false
    },
    planType: {
      type: String,
      enum: ['trial', 'basic', 'premium'],
      default: 'trial'
    },
    trialStartedAt: {
      type: Date,
      default: null
    },
    trialEndedAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    patientCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

VeterinarianSchema.index({ ci: 1 }, { unique: true });
VeterinarianSchema.index({ cmv: 1 }, { unique: true });
VeterinarianSchema.index({ email: 1 }, { unique: true });
VeterinarianSchema.index({ whatsapp: 1 }, { unique: true });

const Veterinarian = mongoose.model<IVeterinarian>('Veterinarian', VeterinarianSchema);
export default Veterinarian;