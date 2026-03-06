import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISkinScraping extends Document {
  labExamId: Types.ObjectId;
  type: "superficial" | "profunda";
  results: string;
}

const SkinScrapingSchema: Schema = new Schema({
  labExamId: { type: Schema.Types.ObjectId, ref: "LabExam", required: true, unique: true },
  type: { type: String, enum: ["superficial", "profunda"], required: true },
  results: { type: String, required: true, trim: true },
}, { timestamps: true });

export default mongoose.model<ISkinScraping>("SkinScraping", SkinScrapingSchema);