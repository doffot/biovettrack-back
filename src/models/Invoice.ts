import mongoose, { Schema, Document } from "mongoose";

// Tipos para el estado
export type InvoiceStatus = "Pendiente" | "Pagado" | "Parcial" | "Cancelado";

// Tipos para los ítems de la factura
export type InvoiceItemType = "grooming" | "labExam" | "consulta" | "vacuna" | "producto";

export interface IInvoiceItem {
  type: InvoiceItemType;
  resourceId: mongoose.Types.ObjectId;
  description: string;
  cost: number;
  quantity: number;
}

export interface IInvoice extends Document {
  ownerId?: mongoose.Types.ObjectId;
  ownerName?: string;
  ownerPhone?: string;
  patientId?: mongoose.Types.ObjectId;
  veterinarianId: mongoose.Types.ObjectId;
  items: IInvoiceItem[];
  currency: string;
  exchangeRate?: number;
  total: number;
  amountPaidUSD: number;
  amountPaidBs: number;
  amountPaid: number;
  paymentStatus: InvoiceStatus;
  paymentMethod?: mongoose.Types.ObjectId;
  paymentReference?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema({
  type: {
    type: String,
    required: [true, "El tipo de ítem es obligatorio"],
    enum: ["grooming", "labExam", "consulta", "vacuna", "producto"],
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    required: [true, "El ID del recurso es obligatorio"],
    refPath: "type",
  },
  description: {
    type: String,
    required: [true, "La descripción es obligatoria"],
    trim: true,
    maxlength: [200, "La descripción no puede exceder 200 caracteres"],
  },
  cost: {
    type: Number,
    required: [true, "El costo es obligatorio"],
    min: [0, "El costo no puede ser negativo"],
  },
  quantity: {
    type: Number,
    required: [true, "La cantidad es obligatoria"],
    min: [1, "La cantidad debe ser al menos 1"],
    default: 1,
  },
});

const InvoiceSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "Owner",
      required: false,
    },
    ownerName: {
      type: String,
      trim: true,
      maxlength: [100, "El nombre del dueño no puede exceder 100 caracteres"],
    },
    ownerPhone: {
      type: String,
      trim: true,
      maxlength: [20, "El teléfono del dueño no puede exceder 20 caracteres"],
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: false,
    },
    veterinarianId: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "La factura debe estar vinculada a un veterinario"],
    },
    items: {
      type: [InvoiceItemSchema],
      required: [true, "La factura debe tener al menos un ítem"],
      validate: {
        validator: (items: IInvoiceItem[]) => items.length > 0,
        message: "La factura debe tener al menos un ítem",
      },
    },
    currency: {
      type: String,
      required: [true, "La moneda es obligatoria"],
      enum: ["USD", "Bs"],
      default: "USD",
    },
    exchangeRate: {
      type: Number,
      min: [0, "El tipo de cambio debe ser positivo"],
      validate: {
        validator: function (value: number) {
          if (this.currency === "Bs") {
            return value != null && value > 0;
          }
          return true;
        },
        message: "El tipo de cambio es obligatorio para pagos en bolívares",
      },
    },
    total: {
      type: Number,
      required: [true, "El total es obligatorio"],
      min: [0, "El total no puede ser negativo"],
    },
    amountPaidUSD: {
      type: Number,
      min: [0, "El monto en USD no puede ser negativo"],
      default: 0,
    },
    amountPaidBs: {
      type: Number,
      min: [0, "El monto en Bs no puede ser negativo"],
      default: 0,
    },
    amountPaid: {
      type: Number,
      required: [true, "El monto pagado es obligatorio"],
      min: [0, "El monto pagado no puede ser negativo"],
      default: 0,
    },
    paymentStatus: {
      type: String,
      required: [true, "El estado de pago es obligatorio"],
      enum: {
        values: ["Pendiente", "Pagado", "Parcial", "Cancelado"],
        message: "Estado de pago no válido",
      },
      default: "Pendiente",
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
    },
    paymentReference: {
      type: String,
      trim: true,
      maxlength: [100, "La referencia no puede exceder 100 caracteres"],
    },
    date: {
      type: Date,
      required: [true, "La fecha de la factura es obligatoria"],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Middleware corregido: siempre recalcula amountPaid y paymentStatus
InvoiceSchema.pre('save', function(next) {
  // Recalcular amountPaid a partir de los montos reales
  const bsToUSD = this.exchangeRate && this.amountPaidBs
    ? this.amountPaidBs / this.exchangeRate
    : 0;
  this.amountPaid = (this.amountPaidUSD || 0) + bsToUSD;

  // Evitar valores negativos
  if (this.amountPaid < 0) this.amountPaid = 0;

  // Recalcular el estado de pago
  const tolerance = 0.01; // Tolerancia para redondeo
  if (this.amountPaid >= this.total - tolerance) {
    this.paymentStatus = 'Pagado';
  } else if (this.amountPaid > 0) {
    this.paymentStatus = 'Parcial';
  } else {
    this.paymentStatus = 'Pendiente';
  }

  next();
});

// Índices
InvoiceSchema.index({ ownerId: 1, paymentStatus: 1 });
InvoiceSchema.index({ ownerName: 1, paymentStatus: 1 });
InvoiceSchema.index({ patientId: 1 });
InvoiceSchema.index({ date: -1 });

const Invoice = mongoose.model<IInvoice>("Invoice", InvoiceSchema);
export default Invoice;