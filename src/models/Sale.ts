// src/models/Sale.ts
import mongoose, { Schema, Document, Types } from "mongoose";

// =============== SALE ITEM ===============
export interface ISaleItem {
  product: Types.ObjectId;
  productName: string;
  quantity: number;
  isFullUnit: boolean;
  unitPrice: number;
  pricePerDose?: number;
  subtotal: number;
  discount: number;
  total: number;
}

const SaleItemSchema = new Schema<ISaleItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: {
    type: String,
    required: true,
    maxlength: 100,
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, "La cantidad debe ser positiva"],
  },
  isFullUnit: {
    type: Boolean,
    default: true,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, "El precio no puede ser negativo"],
  },
  pricePerDose: {
    type: Number,
    min: [0, "El precio por dosis no puede ser negativo"],
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, "El subtotal no puede ser negativo"],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, "El descuento no puede ser negativo"],
  },
  total: {
    type: Number,
    required: true,
    min: [0, "El total no puede ser negativo"],
  },
});

// =============== SALE ===============
export type SaleStatus = "completada" | "pendiente" | "cancelada";

export interface ISale extends Document {
  // Cliente (opcional)
  owner?: Types.ObjectId;
  ownerName?: string;
  ownerPhone?: string;
  
  // Paciente (opcional)
  patient?: Types.ObjectId;
  patientName?: string;
  
  // Items
  items: ISaleItem[];
  
  // Totales
  subtotal: number;
  discountTotal: number;
  total: number;
  
  // Pago
  amountPaidUSD: number;
  amountPaidBs: number;
  creditUsed: number;
  exchangeRate: number;
  amountPaid: number;
  changeAmount: number;
  
  // Estado
  status: SaleStatus;
  isPaid: boolean;
  
  // Factura vinculada (se crea automáticamente)
  invoice?: Types.ObjectId;
  
  // Metadata
  notes?: string;
  veterinarian: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISale>(
  {
    // Cliente
    owner: {
      type: Schema.Types.ObjectId,
      ref: "Owner",
    },
    ownerName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    ownerPhone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    
    // Paciente
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
    },
    patientName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    
    // Items
    items: {
      type: [SaleItemSchema],
      required: true,
      validate: {
        validator: (items: ISaleItem[]) => items.length > 0,
        message: "La venta debe tener al menos un producto",
      },
    },
    
    // Totales
    subtotal: {
      type: Number,
      required: true,
      min: [0, "El subtotal no puede ser negativo"],
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: [0, "El descuento no puede ser negativo"],
    },
    total: {
      type: Number,
      required: true,
      min: [0, "El total no puede ser negativo"],
    },
    
    // Pago
    amountPaidUSD: {
      type: Number,
      default: 0,
      min: [0, "El monto en USD no puede ser negativo"],
    },
    amountPaidBs: {
      type: Number,
      default: 0,
      min: [0, "El monto en Bs no puede ser negativo"],
    },
    creditUsed: {
      type: Number,
      default: 0,
      min: [0, "El crédito usado no puede ser negativo"],
    },
    exchangeRate: {
      type: Number,
      default: 1,
      min: [0.01, "La tasa de cambio debe ser positiva"],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, "El monto pagado no puede ser negativo"],
    },
    changeAmount: {
      type: Number,
      default: 0,
      min: [0, "El cambio no puede ser negativo"],
    },
    
    // Estado
    status: {
      type: String,
      enum: ["completada", "pendiente", "cancelada"],
      default: "completada",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    
    // Factura
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
    
    // Metadata
    notes: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    veterinarian: {
      type: Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware: calcular amountPaid y isPaid antes de guardar
SaleSchema.pre("save", function (next) {
  const bsToUSD = this.exchangeRate > 0 ? this.amountPaidBs / this.exchangeRate : 0;
  this.amountPaid = this.amountPaidUSD + bsToUSD + this.creditUsed;
  
  const tolerance = 0.01;
  this.isPaid = this.amountPaid >= this.total - tolerance;
  
  // Calcular cambio
  if (this.amountPaid > this.total) {
    this.changeAmount = this.amountPaid - this.total;
  } else {
    this.changeAmount = 0;
  }
  
  next();
});

// Índices
SaleSchema.index({ veterinarian: 1, createdAt: -1 });
SaleSchema.index({ owner: 1 });
SaleSchema.index({ patient: 1 });
SaleSchema.index({ status: 1 });
SaleSchema.index({ isPaid: 1 });
SaleSchema.index({ createdAt: -1 });

const Sale = mongoose.model<ISale>("Sale", SaleSchema);
export default Sale;