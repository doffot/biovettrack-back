// src/models/Urinalysis.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUrinalysis extends Document {
  labExamId: Types.ObjectId;
  // Método de recolección
  collectionMethod?: string;
  // Examen Físico
  color: string;
  appearance: string;
  specificGravity?: number;
  // Examen Químico
  pH?: number;
  proteins?: string;
  glucose?: string;
  ketones?: string;
  bilirubin?: string;
  blood?: string;
  urobilinogen?: string;
  nitrites?: string;
  leukocytesChemical?: string;
  // Sedimento
  epithelialCells?: string;
  sedimentLeukocytes?: string;
  sedimentErythrocytes?: string;
  bacteria?: string;
  crystals?: string;
  casts?: string;
  otherFindings?: string;
}

const UrinalysisSchema: Schema = new Schema({
  labExamId: { type: Schema.Types.ObjectId, ref: "LabExam", required: true, unique: true },
  // Método de recolección
  collectionMethod: { type: String },
  // Examen Físico
  color: { type: String, required: true },
  appearance: { type: String, required: true },
  specificGravity: { type: Number },
  // Examen Químico
  pH: { type: Number },
  proteins: { type: String },
  glucose: { type: String },
  ketones: { type: String },
  bilirubin: { type: String },
  blood: { type: String },
  urobilinogen: { type: String },
  nitrites: { type: String },
  leukocytesChemical: { type: String },
  // Sedimento
  epithelialCells: { type: String },
  sedimentLeukocytes: { type: String },
  sedimentErythrocytes: { type: String },
  bacteria: { type: String },
  crystals: { type: String },
  casts: { type: String },
  otherFindings: { type: String },
}, { timestamps: true });

export default mongoose.model<IUrinalysis>("Urinalysis", UrinalysisSchema);