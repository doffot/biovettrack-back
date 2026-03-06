import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDifferentialCount {
  segmentedNeutrophils: number;
  bandNeutrophils: number;
  lymphocytes: number;
  monocytes: number;
  basophils: number;
  reticulocytes: number;
  eosinophils: number;
  nrbc: number;
}

export interface IHematology extends Document {
  labExamId: Types.ObjectId;
  hematocrit: number;
  whiteBloodCells: number;
  totalProtein: number;
  platelets: number;
  differentialCount: IDifferentialCount;
  totalCells: number;
  hemotropico?: string;
  observacion?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DifferentialSchema = new Schema(
  {
    segmentedNeutrophils: { type: Number, min: 0, max: 100, default: 0 },
    bandNeutrophils: { type: Number, min: 0, max: 100, default: 0 },
    lymphocytes: { type: Number, min: 0, max: 100, default: 0 },
    monocytes: { type: Number, min: 0, max: 100, default: 0 },
    basophils: { type: Number, min: 0, max: 100, default: 0 },
    reticulocytes: { type: Number, min: 0, max: 100, default: 0 },
    eosinophils: { type: Number, min: 0, max: 100, default: 0 },
    nrbc: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

const HematologySchema: Schema = new Schema(
  {
    labExamId: {
      type: Schema.Types.ObjectId,
      ref: "LabExam",
      required: true,
      unique: true,
      index: true,
    },
    hematocrit: { type: Number, required: true, min: 0 },
    whiteBloodCells: { type: Number, required: true, min: 0 },
    totalProtein: { type: Number, required: true, min: 0 },
    platelets: { type: Number, required: true, min: 0 },
    differentialCount: { type: DifferentialSchema, required: true },
    totalCells: { type: Number, required: true, min: 0, max: 100 },
    hemotropico: { type: String, trim: true },
    observacion: { type: String, trim: true },
  },
  { timestamps: true }
);

const Hematology = mongoose.model<IHematology>("Hematology", HematologySchema);
export default Hematology;