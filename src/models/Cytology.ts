// src/models/Cytology.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICytology extends Document {
  labExamId: Types.ObjectId;
  sampleType: string;
  coloration: string;
  results: string;
  createdAt: Date;
  updatedAt: Date;
}

const CytologySchema: Schema = new Schema(
  {
    labExamId: {
      type: Schema.Types.ObjectId,
      ref: "LabExam",
      required: true,
      unique: true,
      index: true,
    },
    sampleType: {
      type: String,
      required: [true, "El tipo de muestra es obligatorio"],
      trim: true,
    },
    coloration: {
      type: String,
      required: [true, "La coloración es obligatoria"],
      trim: true,
    },
    results: {
      type: String,
      required: [true, "Los resultados son obligatorios"],
      trim: true,
    },
  },
  { timestamps: true }
);

const Cytology = mongoose.model<ICytology>("Cytology", CytologySchema);
export default Cytology;