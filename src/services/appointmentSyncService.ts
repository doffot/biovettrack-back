// src/services/appointmentSyncService.ts
import mongoose from "mongoose";
import Appointment, { AppointmentStatus } from "../models/Appointment";
import GroomingService from "../models/GroomingService";
import Vaccination from "../models/Vaccination";
import Consultation from "../models/Consultation";
import LabExam from "../models/LabExam";
import Deworming from "../models/Deworming";

interface SyncResult {
  updated: boolean;
  appointmentStatus?: string;
  message: string;
}

// Mapeo de status de cada servicio a status normalizado
const STATUS_MAP: Record<string, "pending" | "completed" | "cancelled"> = {
  // Grooming
  "Programado": "pending",
  "En progreso": "pending",
  "Completado": "completed",
  "Cancelado": "cancelled",
  
  // Vaccination
  "Programada": "pending",
  "Aplicada": "completed",
  "Cancelada": "cancelled",
  
  "En proceso": "pending",
};

export class AppointmentSyncService {

  /**
   * Verifica y actualiza el status de una cita basado en sus servicios vinculados
   */
  static async checkAndUpdateAppointment(appointmentId: mongoose.Types.ObjectId | string): Promise<SyncResult> {
    try {
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        return { updated: false, message: "Cita no encontrada" };
      }

      const services = await this.getLinkedServices(appointmentId);

      if (services.length === 0) {
        return { updated: false, message: "No hay servicios vinculados" };
      }

      const newStatus = this.determineAppointmentStatus(services);

      if (newStatus && newStatus !== appointment.status) {
        appointment.status = newStatus;
        await appointment.save();
        return { 
          updated: true, 
          appointmentStatus: newStatus,
          message: `Cita actualizada a ${newStatus}` 
        };
      }

      return { updated: false, message: "Sin cambios necesarios" };

    } catch (error) {
      console.error("Error en checkAndUpdateAppointment:", error);
      return { updated: false, message: "Error al sincronizar" };
    }
  }

  /**
   * Normaliza el status de un servicio
   */
  private static normalizeStatus(status: string): "pending" | "completed" | "cancelled" {
    return STATUS_MAP[status] || "pending";
  }

  /**
   * Obtiene todos los servicios vinculados a una cita
   */
  private static async getLinkedServices(appointmentId: mongoose.Types.ObjectId | string) {
    const [grooming, vaccinations, consultations, labExams, dewormings] = await Promise.all([
      GroomingService.find({ appointmentId }).select("status").lean(),
      Vaccination.find({ appointmentId }).select("status").lean(),
      Consultation.find({ appointmentId }).select("status").lean(),
      LabExam.find({ appointmentId }).select("status").lean(),
      Deworming.find({ appointmentId }).select("status").lean(),
    ]);

    const allServices = [
      ...grooming.map(s => ({ 
        type: "grooming", 
        status: s.status,
        normalized: this.normalizeStatus(s.status)
      })),
      ...vaccinations.map(s => ({ 
        type: "vaccination", 
        status: (s as any).status || "Programada",
        normalized: this.normalizeStatus((s as any).status || "Programada")
      })),
      ...consultations.map(s => ({ 
        type: "consultation", 
        status: (s as any).status || "Completado",
        normalized: this.normalizeStatus((s as any).status || "Completado")
      })),
      ...labExams.map(s => ({ 
        type: "labExam", 
        status: (s as any).status || "Programado",
        normalized: this.normalizeStatus((s as any).status || "Programado")
      })),
      ...dewormings.map(s => ({ 
        type: "deworming", 
        status: (s as any).status || "Completado",
        normalized: this.normalizeStatus((s as any).status || "Completado")
      })),
    ];

    return allServices;
  }

  /**
   * Determina el status de la cita basado en los status de los servicios
   */
  private static determineAppointmentStatus(
    services: { type: string; status: string; normalized: string }[]
  ): AppointmentStatus | null {
    const normalizedStatuses = services.map(s => s.normalized);

    // Si todos están cancelados → Cita cancelada
    if (normalizedStatuses.every(s => s === "cancelled")) {
      return "Cancelada";
    }

    // Si todos están completados o cancelados → Cita completada
    if (normalizedStatuses.every(s => s === "completed" || s === "cancelled")) {
      return "Completada";
    }

    // Si hay alguno pendiente → Cita programada
    if (normalizedStatuses.some(s => s === "pending")) {
      return "Programada";
    }

    return null;
  }
}