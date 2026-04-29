import mongoose, { Schema, Document } from "mongoose";

export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export interface IMedicalOrder extends Document {
  patientId: mongoose.Types.ObjectId;
  veterinarianId: mongoose.Types.ObjectId;
  status: OrderStatus;
  issueDate: Date;
  // Categorías de la imagen
  hematology: string[];
  coprology: string[];
  urinalysis: string[];
  cytology: string[];
  hormonal: string[];
  skin: string[];
  chemistry: string[];
  cultures: string[];
  antigenicTests: string[];
  specialExams?: string;
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalOrderSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "La orden debe estar vinculada a un paciente"],
    },
    veterinarianId: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "La orden debe estar vinculada a un veterinario"],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    // Arrays de strings para los checkboxes
    hematology: { type: [String], enum: ['Hematología Completa', 'Despistaje Hemoparásitos', 'Contaje Plaquetario', 'PT', 'PTT'] },
    coprology: { type: [String], enum: ['Evaluación Fresca', 'Flotación', 'Sangre Oculta en Heces', 'Determ. Polisacáridos en Heces', 'Heces Coloreadas'] },
    urinalysis: { type: [String], enum: ['Tira Reactiva', 'Sedimento Fresco', 'Sedimento Coloreado'] },
    cytology: { type: [String] }, // Dejé este abierto o puedes poner el enum largo anterior
    hormonal: { type: [String], enum: ['Cortisol', 'T3', 'T4'] },
    skin: { type: [String], enum: ['Raspado Cutáneo', 'Tricograma', 'Cinta Adhesiva'] },
    chemistry: { type: [String] }, // Enum largo de químicos
    cultures: { type: [String], enum: ['Bacteriológico', 'Micológico', 'Urocultivo', 'Coprocultivo', 'Hemocultivo'] },
    antigenicTests: { type: [String] }, // Enum de virus
    specialExams: { type: String, trim: true },
    observations: { type: String, trim: true },
  },
  { timestamps: true }
);

MedicalOrderSchema.index({ patientId: 1, issueDate: -1 });

const MedicalOrder = mongoose.model<IMedicalOrder>("MedicalOrder", MedicalOrderSchema);
export default MedicalOrder;