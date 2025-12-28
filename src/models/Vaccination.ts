// src/models/Vaccination.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IVaccination extends Document {
  patientId?: mongoose.Types.ObjectId;
  veterinarianId: mongoose.Types.ObjectId;
  vaccinationDate: Date;
  vaccineType: string;
  cost: number;
  laboratory?: string;
  batchNumber?: string;
  expirationDate?: Date;
  nextVaccinationDate?: Date;
  observations?: string;
  // Datos para pacientes referidos (sin patientId)
  patientName?: string;
  species?: string;
  ownerName?: string;
  ownerPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VaccinationSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: false,
    },
    veterinarianId: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "La vacuna debe estar vinculada a un veterinario"],
    },
    vaccinationDate: {
      type: Date,
      required: [true, "La fecha de vacunación es obligatoria"],
    },
    vaccineType: {
      type: String,
      required: [true, "El tipo de vacuna es obligatorio"],
      trim: true,
      maxlength: [50, "Máximo 50 caracteres"],
    },
    cost: {
      type: Number,
      required: [true, "El costo es obligatorio"],
      min: [0, "El costo no puede ser negativo"],
    },
    laboratory: {
      type: String,
      trim: true,
      maxlength: [100, "Máximo 100 caracteres"],
    },
    batchNumber: {
      type: String,
      trim: true,
      maxlength: [50, "Máximo 50 caracteres"],
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
      maxlength: [300, "Máximo 300 caracteres"],
    },
    // Campos para pacientes referidos
    patientName: {
      type: String,
      trim: true,
      required: function (this: any) {
        return !this.patientId;
      },
    },
    species: {
      type: String,
      trim: true,
    },
    ownerName: {
      type: String,
      trim: true,
      required: function (this: any) {
        return !this.patientId;
      },
    },
    ownerPhone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Vaccination = mongoose.model<IVaccination>("Vaccination", VaccinationSchema);
export default Vaccination;