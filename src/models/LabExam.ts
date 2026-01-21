// src/models/LabExam.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILabExam extends Document {
  vetId: Types.ObjectId;
  patientId?: Types.ObjectId;
  patientName: string;
  species: string;
  breed?: string;
  sex?: string;
  age?: string;
  weight?: number;

  cost: number;
  discount: number;

  treatingVet?: string;
  date: Date;
  hematocrit: number;
  whiteBloodCells: number;
  totalProtein: number;
  platelets: number;
  differentialCount: {
    segmentedNeutrophils: number;
    bandNeutrophils: number;
    lymphocytes: number;
    monocytes: number;
    basophils: number;
    reticulocytes: number;
    eosinophils: number;
    nrbc: number;
  };
  totalCells: number;
  hemotropico?: string;
  observacion?: string;

  ownerName?: string;
  ownerPhone?: string;

  createdAt: Date;
  updatedAt: Date;
}

const DifferentialSchema = new Schema({
  segmentedNeutrophils: { type: Number, min: 0, max: 100, default: 0 },
  bandNeutrophils:      { type: Number, min: 0, max: 100, default: 0 },
  lymphocytes:          { type: Number, min: 0, max: 100, default: 0 },
  monocytes:            { type: Number, min: 0, max: 100, default: 0 },
  basophils:            { type: Number, min: 0, max: 100, default: 0 },
  reticulocytes:        { type: Number, min: 0, max: 100, default: 0 },
  eosinophils:          { type: Number, min: 0, max: 100, default: 0 },
  nrbc:                 { type: Number, min: 0, max: 100, default: 0 },
}, { _id: false });

const LabExamSchema: Schema = new Schema({
  vetId: { 
    type: Types.ObjectId, 
    ref: 'Veterinarian',
    required: true 
  },

  patientId: {
    type: Types.ObjectId,
    ref: 'Patient',
    required: false
  },

  patientName: { 
    type: String, 
    required: [true, "El nombre del paciente es obligatorio"], 
    trim: true 
  },
  species: { 
    type: String, 
    required: [true, "La especie es obligatoria"], 
    trim: true 
  },
  breed: { type: String, trim: true },
  sex: { type: String, trim: true },
  age: { type: String, trim: true },
  weight: { type: Number, min: 0 },

  cost: {
    type: Number,
    required: [true, "El costo del examen es obligatorio"],
    min: [0, "El costo no puede ser negativo"]
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, "El descuento no puede ser negativo"]
  },

  treatingVet: { type: String, trim: true },
  date: { type: Date, required: true, default: Date.now },
  
  hematocrit: { type: Number, required: true, min: 0 },
  whiteBloodCells: { type: Number, required: true, min: 0 },
  totalProtein: { type: Number, required: true, min: 0 },
  platelets: { type: Number, required: true, min: 0 },
  differentialCount: { type: DifferentialSchema, required: true },
  totalCells: { type: Number, required: true, min: 0, max: 100 },
  hemotropico: { type: String, trim: true },
  observacion: { type: String, trim: true },

  ownerName: {
    type: String,
    trim: true,
    required: function(this: any) {
      return !this.patientId;
    },
    validate: {
      validator: (value: string) => value?.trim().length > 0,
      message: "El nombre del dueño es obligatorio para pacientes referidos"
    }
  },
  ownerPhone: {
    type: String,
    trim: true
  },
}, { timestamps: true });

const LabExam = mongoose.model<ILabExam>('LabExam', LabExamSchema);
export default LabExam;