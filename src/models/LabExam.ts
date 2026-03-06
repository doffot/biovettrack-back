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

  examType: string;

  ownerName?: string;
  ownerPhone?: string;

  createdAt: Date;
  updatedAt: Date;
}

const LabExamSchema: Schema = new Schema(
  {
    vetId: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: true,
    },

    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: false,
    },

    patientName: {
      type: String,
      required: [true, "El nombre del paciente es obligatorio"],
      trim: true,
    },
    species: {
      type: String,
      required: [true, "La especie es obligatoria"],
      trim: true,
    },
    breed: { type: String, trim: true },
    sex: { type: String, trim: true },
    age: { type: String, trim: true },
    weight: { type: Number, min: 0 },

    cost: {
      type: Number,
      required: [true, "El costo del examen es obligatorio"],
      min: [0, "El costo no puede ser negativo"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "El descuento no puede ser negativo"],
    },

    treatingVet: { type: String, trim: true },
    date: { type: Date, required: true, default: Date.now },

    examType: {
      type: String,
      required: true,
      default: "hematology",
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
  { timestamps: true }
);

const LabExam = mongoose.model<ILabExam>("LabExam", LabExamSchema);
export default LabExam;