import mongoose, { Schema, Document } from 'mongoose';
import { IVeterinarian } from './Veterinarian';
import { IOwner } from './Owner';

// Tipos
export type Sex = 'Macho' | 'Hembra';
export type Species =
  | 'Canino'
  | 'Felino'
  | 'Conejo'
  | 'Ave'
  | 'Reptil'
  | 'Roedor'
  | 'Hurón'
  | 'Otro';

// Interfaz IPatient
export interface IPatient extends Document {
  name: string;
  birthDate: Date;
  sex: Sex;
  species: Species;
  breed?: string;
  weight?: number;
  owner: mongoose.Types.ObjectId | IOwner; // Referencia al dueño
  photo?: string;
  mainVet: mongoose.Types.ObjectId | IVeterinarian; // ✅ Ahora es ObjectId, no string
  referringVet?: string; // Opcional: nombre de veterinario referido (texto libre)
  createdAt: Date;
  updatedAt: Date;
}

// Esquema
const PatientSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    birthDate: {
      type: Date,
      required: [true, 'La fecha de nacimiento es obligatoria']
    },
    sex: {
      type: String,
      required: [true, 'El sexo es obligatorio'],
      enum: ['Macho', 'Hembra']
    },
    species: {
      type: String,
      required: [true, 'La especie es obligatoria'],
      enum: [
        'Canino',
        'Felino',
        'Conejo',
        'Ave',
        'Reptil',
        'Roedor',
        'Hurón',
        'Otro'
      ]
    },
    breed: {
      type: String,
      trim: true
    },
    weight: {
      type: Number,
      min: [0, 'El peso no puede ser negativo']
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Owner',
      required: [true, 'El paciente debe tener un dueño']
    },
    photo: {
      type: String,
      required: false,
      trim: true,
      default: null
    },
    
    mainVet: {
      type: Schema.Types.ObjectId,
      ref: 'Veterinarian',
      required: [true, 'El veterinario principal es obligatorio']
    },
    // referringVet sigue siendo un string opcional (nombre libre)
    referringVet: {
      type: String,
      required: false,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true
  }
);



PatientSchema.set('toJSON', { virtuals: true });
PatientSchema.set('toObject', { virtuals: true });

// Modelo
const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
export default Patient;