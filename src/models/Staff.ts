import mongoose, { Schema, Document } from 'mongoose';

// Roles permitidos para el personal
export type StaffRole = 'veterinario' | 'groomer' | 'asistente' | 'recepcionista';

// Interfaz
export interface IStaff extends Document {
  name: string;
  lastName: string;
  role: StaffRole;
  isOwner?: boolean;
  veterinarianId?: mongoose.Types.ObjectId; 
  phone?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}


const StaffSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [50, 'El nombre no puede exceder los 50 caracteres'],
    },
    lastName: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true,
      maxlength: [50, 'El apellido no puede exceder los 50 caracteres'],
    },
    role: {
      type: String,
      required: [true, 'El rol del personal es obligatorio'],
      enum: {
        values: ['veterinario', 'groomer', 'asistente', 'recepcionista'],
        message: 'Rol no válido. Debe ser: veterinario, groomer, asistente o recepcionista',
      },
    },
    isOwner: {
      type: Boolean,
      default: false,
    },
    veterinarianId: {
      type: Schema.Types.ObjectId,
      ref: 'Veterinarian',
      // No es obligatorio para todos, solo para el dueño
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'El número de teléfono no puede exceder los 20 caracteres'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, 
  }
);



// Modelo
const Staff = mongoose.model<IStaff>('Staff', StaffSchema);
export default Staff;