// src/models/VeterinaryService.ts
import mongoose, { Schema, Document, Types } from "mongoose";

// Interfaz para los productos/insumos usados
export interface IServiceProduct {
  productId?: Types.ObjectId;     // Opcional: si es de inventario
  productName: string;            
  quantity: number;
  unitPrice: number;              
  subtotal: number;               
}

// Interfaz principal del servicio
export interface IVeterinaryService extends Document {
  patientId: Types.ObjectId;
  veterinarianId: Types.ObjectId;
  serviceDate: Date;
  
  serviceName: string;            // Ej: "Limpieza Dental", "Cura de herida"
  description?: string;
  
  products: IServiceProduct[];    // Array de insumos utilizados
  
  // Desglose financiero
  productsTotal: number;          // Costo total de insumos
  veterinarianFee: number;        // Honorarios profesionales
  subtotal: number;               // Suma de insumos + honorarios
  discount: number;               // Descuento aplicado
  totalCost: number;              // Total final a cobrar
  
  status: "Completado" | "Pendiente" | "Cancelado";
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Schema de productos individuales
const ServiceProductSchema = new Schema({
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: "Product", 
    required: false 
  },
  productName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  unitPrice: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  subtotal: { 
    type: Number, 
    required: true, 
    min: 0 
  },
});

// Schema principal del servicio
const VeterinaryServiceSchema = new Schema(
  {
    patientId: { 
      type: Schema.Types.ObjectId, 
      ref: "Patient", 
      required: true 
    },
    veterinarianId: { 
      type: Schema.Types.ObjectId, 
      ref: "Veterinarian", 
      required: true 
    },
    serviceDate: { 
      type: Date, 
      default: Date.now 
    },
    
    serviceName: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 150 
    },
    description: { 
      type: String, 
      trim: true, 
      maxlength: 500 
    },
    
    // Insumos
    products: { 
      type: [ServiceProductSchema], 
      default: [] 
    },
    
    // Costos y Honorarios
    productsTotal: { 
      type: Number, 
      default: 0 
    },
    veterinarianFee: { 
      type: Number, 
      required: true, 
      default: 0, 
      min: 0 
    },
    
    // Cálculos finales
    subtotal: { 
      type: Number, 
      default: 0 
    },
    discount: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    totalCost: { 
      type: Number, 
         default: 0,
      min: 0 
    },
    
    status: {
      type: String,
      enum: ["Completado", "Pendiente", "Cancelado"],
      default: "Completado",
    },
    notes: { 
      type: String, 
      trim: true 
    },
  },
  { 
    timestamps: true 
  }
);

// Middleware: Calcular costos automáticamente antes de guardar
VeterinaryServiceSchema.pre("save", function (next) {
  // 1. Sumar total de productos
  this.productsTotal = this.products.reduce((sum, p) => sum + (p.subtotal || 0), 0);
  
  // 2. Calcular subtotal (Productos + Honorarios)
  this.subtotal = this.productsTotal + (this.veterinarianFee || 0);
  
  // 3. Calcular total final aplicando descuento
  const total = this.subtotal - (this.discount || 0);
  this.totalCost = total > 0 ? total : 0; // Evitar negativos
  
  next();
});

// Índices para mejorar rendimiento de búsquedas
VeterinaryServiceSchema.index({ patientId: 1, serviceDate: -1 });
VeterinaryServiceSchema.index({ veterinarianId: 1 });
VeterinaryServiceSchema.index({ serviceName: "text" });

const VeterinaryService = mongoose.model<IVeterinaryService>("VeterinaryService", VeterinaryServiceSchema);
export default VeterinaryService;