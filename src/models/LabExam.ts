// src/models/LabExam.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILabExam extends Document {
  patientId: Types.ObjectId;
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
}

const DifferentialSchema = new Schema({
  segmentedNeutrophils: { type: Number, min: 0, max: 100, default: 0 },
  bandNeutrophils:     { type: Number, min: 0, max: 100, default: 0 },
  lymphocytes:         { type: Number, min: 0, max: 100, default: 0 },
  monocytes:           { type: Number, min: 0, max: 100, default: 0 },
  basophils:           { type: Number, min: 0, max: 100, default: 0 },
  reticulocytes:       { type: Number, min: 0, max: 100, default: 0 },
  eosinophils:         { type: Number, min: 0, max: 100, default: 0 },
  nrbc:                { type: Number, min: 0, max: 100, default: 0 },
}, { _id: false });

const LabExamSchema: Schema = new Schema({
  patientId: { type:Types.ObjectId, ref: 'Patient', required: true },
  date: { type: Date, default: Date.now },
  hematocrit: { type: Number, required: true, min: 0 },
  whiteBloodCells: { type: Number, required: true, min: 0 },
  totalProtein: { type: Number, required: true, min: 0 },
  platelets: { type: Number, required: true, min: 0 },
  differentialCount: { type: DifferentialSchema, required: true },
  totalCells: { type: Number, required: true, min: 0, max: 100 }
}, { timestamps: true });

const LabExam = mongoose.model<ILabExam>('LabExam', LabExamSchema);
export default LabExam;