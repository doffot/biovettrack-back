import mongoose, { Schema, Document } from "mongoose";

export interface IDeworming extends Document {
  patientId: mongoose.Types.ObjectId;
  veterinarianId?: mongoose.Types.ObjectId; // Ahora es opcional en la interfaz
  productId?: mongoose.Types.ObjectId;
  source: "Interno" | "Externo";
  dewormingType: "Interna" | "Externa" | "Ambas";
  productName: string;
  dose: string;
  cost: number;
  applicationDate: Date;
  nextApplicationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DewormingSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "El ID del paciente es obligatorio"],
    },
    veterinarianId: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      // Validación dinámica: obligatorio solo si la fuente es Interno
      required: function (this: IDeworming) {
        return this.source === "Interno";
      },
    },
    source: {
      type: String,
      required: [true, "El origen (source) es obligatorio"],
      enum: {
        values: ["Interno", "Externo"],
        message: "El origen debe ser 'Interno' (clínica) o 'Externo' (fuera de la clínica)",
      },
      default: "Interno",
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    dewormingType: {
      type: String,
      required: [true, "El tipo de desparasitación es obligatorio"],
      enum: {
        values: ["Interna", "Externa", "Ambas"],
        message: "Tipo inválido: debe ser Interna, Externa o Ambas",
      },
    },
    productName: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre del producto no puede exceder 100 caracteres"],
    },
    dose: {
      type: String,
      required: [true, "La dosis aplicada es obligatoria"],
      trim: true,
      maxlength: [50, "La dosis no puede exceder 50 caracteres"],
    },
    cost: {
      type: Number,
      required: [true, "El costo es obligatorio"],
      min: [0, "El costo no puede ser negativo"],
      default: 0,
    },
    applicationDate: {
      type: Date,
      required: [true, "La fecha de aplicación es obligatoria"],
      default: Date.now,
    },
    nextApplicationDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimizar búsquedas frecuentes
DewormingSchema.index({ patientId: 1, applicationDate: -1 });
DewormingSchema.index({ veterinarianId: 1, applicationDate: -1 });
DewormingSchema.index({ source: 1 });

const Deworming = mongoose.model<IDeworming>("Deworming", DewormingSchema);

export default Deworming;