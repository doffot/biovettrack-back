// models/QuickTest.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IQuickTest extends Document {
  labExamId: Types.ObjectId;
  testName: string; // Nombre del test (ej: 4Dx, Moquillo, etc.)
  results: string;
  
  // ← NUEVOS CAMPOS PARA INVENTARIO
  source?: "Interno" | "Externo";
  productId?: Types.ObjectId;
  quantity?: number;
}

const QuickTestSchema: Schema = new Schema({
  labExamId: { 
    type: Schema.Types.ObjectId, 
    ref: "LabExam", 
    required: true, 
    unique: true 
  },
  testName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  results: { 
    type: String, 
    required: true, 
    trim: true 
  },
  
  // ← NUEVOS CAMPOS
  source: {
    type: String,
    enum: ["Interno", "Externo"],
    default: "Externo",
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: function(this: IQuickTest) {
      return this.source === "Interno";
    }
  },
  quantity: {
    type: Number,
    min: 1,
    default: 1,
  },
}, { timestamps: true });

export default mongoose.model<IQuickTest>("QuickTest", QuickTestSchema);