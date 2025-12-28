// src/models/Appointment.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IPatient } from './Patient';

// Tipos
export type AppointmentType = 'Consulta' | 'Peluquería' | 'Laboratorio' | 'Vacuna' | 'Cirugía' | 'Tratamiento';
export type AppointmentStatus = 'Programada' | 'Completada' | 'Cancelada' | 'No asistió';

// Interfaz
export interface IAppointment extends Document {
  patient: mongoose.Types.ObjectId | IPatient;
  type: AppointmentType;
  date: Date;
  status: AppointmentStatus;
  reason: string;
  observations?: string;
  prepaidAmount?: number; // Monto prepagado (opcional)
  createdAt: Date;
  updatedAt: Date;
}

// Esquema
const AppointmentSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'La cita debe estar asociada a un paciente'],
    },
    type: {
      type: String,
      required: [true, 'El tipo de cita es obligatorio'],
      enum: {
        values: ['Consulta', 'Peluquería', 'Laboratorio', 'Vacuna', 'Cirugía', 'Tratamiento'],
        message: 'Tipo de cita no válido',
      },
    },
    date: {
      type: Date,
      required: [true, 'La fecha y hora de la cita son obligatorias'],
    },
    status: {
      type: String,
      required: [true, 'El estado de la cita es obligatorio'],
      enum: {
        values: ['Programada', 'Completada', 'Cancelada', 'No asistió'],
        message: 'Estado de cita no válido',
      },
      default: 'Programada',
    },
    reason: {
      type: String,
      required: [true, 'El motivo o detalle del servicio es obligatorio'],
      trim: true,
      maxlength: [200, 'El motivo no puede exceder 200 caracteres'],
    },
    observations: {
      type: String,
      required: false,
      trim: true,
      maxlength: [500, 'Las observaciones no pueden exceder 500 caracteres'],
    },
    prepaidAmount: {
      type: Number,
      required: false,
      min: [0, 'El monto prepagado no puede ser negativo'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

AppointmentSchema.set('toJSON', { virtuals: true });
AppointmentSchema.set('toObject', { virtuals: true });

const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
export default Appointment;