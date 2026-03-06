import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITrichogram extends Document {
  labExamId: Types.ObjectId;
  results: string;
}

const TrichogramSchema: Schema = new Schema({
  labExamId: { type: Schema.Types.ObjectId, ref: "LabExam", required: true, unique: true },
  results: { type: String, required: true, trim: true },
}, { timestamps: true });

export default mongoose.model<ITrichogram>("Trichogram", TrichogramSchema);