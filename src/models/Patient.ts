// models/Patient.ts
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

// Interfaz IPatient actualizada
export interface IPatient extends Document {
  name: string;
  birthDate: Date;
  sex: Sex;
  species: Species;
  breed?: string;
  weight?: number;
  color?: string; 
  identification?: string; 
  owner: mongoose.Types.ObjectId | IOwner;
  photo?: string;
  mainVet: mongoose.Types.ObjectId | IVeterinarian;
  referringVet?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Esquema actualizado
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
    color: { 
      type: String,
      trim: true,
      default: null
    },
    identification: { 
      type: String,
      trim: true,
      default: null
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

const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
export default Patient;