// src/models/Vaccination.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IVaccination extends Document {
  patientId: mongoose.Types.ObjectId;
  veterinarianId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  vaccineType: string;
  source: 'internal' | 'external';
  appliedBy?: string;
  cost: number;
  vaccinationDate: Date;
  laboratory?: string;
  batchNumber?: string;
  expirationDate?: Date;
  nextVaccinationDate?: Date;
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VaccinationSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "El ID del paciente es obligatorio"],
    },
    veterinarianId: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "El ID del veterinario es obligatorio"],
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    vaccineType: {
      type: String,
      required: [true, "El tipo de vacuna es obligatorio"],
      trim: true,
      maxlength: [50, "El tipo de vacuna no puede exceder 50 caracteres"],
    },
    source: {
      type: String,
      required: [true, "El origen de la vacuna es obligatorio"],
      enum: ['internal', 'external'],
      default: 'internal',
    },
    appliedBy: {
      type: String,
      trim: true,
      maxlength: [100, "El nombre del aplicador no puede exceder 100 caracteres"],
    },
    cost: {
      type: Number,
      required: function (this: IVaccination) {
        return this.source === 'internal';
      },
      min: [0, "El costo no puede ser negativo"],
    },
    vaccinationDate: {
      type: Date,
      required: [true, "La fecha de vacunación es obligatoria"],
    },
    laboratory: {
      type: String,
      trim: true,
      maxlength: [100, "El laboratorio no puede exceder 100 caracteres"],
    },
    batchNumber: {
      type: String,
      trim: true,
      maxlength: [50, "El número de lote no puede exceder 50 caracteres"],
    },
    expirationDate: {
      type: Date,
    },
    nextVaccinationDate: {
      type: Date,
    },
    observations: {
      type: String,
      trim: true,
      maxlength: [300, "Las observaciones no pueden exceder 300 caracteres"],
    },
  },
  {
    timestamps: true,
  }
);

// Índices
VaccinationSchema.index({ patientId: 1, vaccinationDate: -1 });
VaccinationSchema.index({ veterinarianId: 1, vaccinationDate: -1 });
VaccinationSchema.index({ source: 1, patientId: 1 });

const Vaccination = mongoose.model<IVaccination>("Vaccination", VaccinationSchema);
export default Vaccination;