// models/Patient.ts
import Owner, { IOwner } from './Owner';
import mongoose, { Schema, Document } from 'mongoose';

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
  owner: IOwner['_id'];
  photo?: string;
  createdAt: Date;
  updatedAt: Date;

  // ✅ NUEVOS CAMPOS
  mainVet: string;           // Nombre del veterinario del sistema (obligatorio)
  referringVet?: string;     // Nombre del veterinario referido (opcional)
}

// Esquema
const PatientSchema = new Schema({
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
      "Canino",
      "Felino",
      "Conejo",
      "Ave",
      "Reptil",
      "Roedor",
      "Hurón",
      "Otro"
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

  // ✅ CAMPOS NUEVOS EN EL ESQUEMA
  mainVet: {
    type: String,
    required: [true, 'El nombre del veterinario principal es obligatorio']
  },
  referringVet: {
    type: String,
    required: false,
    trim: true,
    default: null
  }
}, {
  timestamps: true
});

// Virtuals
PatientSchema.set('toJSON', { virtuals: true });
PatientSchema.set('toObject', { virtuals: true });

// Modelo
const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
export default Patient;