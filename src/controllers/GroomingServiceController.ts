// controllers/GroomingServiceController.ts
import type { Request, Response } from "express";
import GroomingService from "../models/GroomingService";
import Patient from "../models/Patient";
import mongoose from "mongoose";

export class GroomingServiceController {
  /* ---------- HELPER: Normalizar fecha para evitar problemas de timezone ---------- */
  private static normalizeDate(dateInput?: string | Date): Date {
    if (!dateInput) {
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      return now;
    }
    
    const dateStr = typeof dateInput === 'string' 
      ? dateInput.split('T')[0] 
      : dateInput.toISOString().split('T')[0];
    
    return new Date(dateStr + 'T12:00:00');
  }

  /* ---------- CREAR SERVICIO DE GROOMING (usando params) ---------- */
  static createGroomingService = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const serviceData = req.body;

    try {
      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ msg: 'ID de paciente inválido' });
      }

      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ msg: 'Paciente no encontrado' });
      }

      const groomingService = new GroomingService({
        ...serviceData,
        patientId: patientId,
        date: GroomingServiceController.normalizeDate(serviceData.date), // ✅ CAMBIADO
      });

      await groomingService.save();

      res.status(201).json({
        msg: 'Servicio de peluquería registrado correctamente',
        service: groomingService,
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: "Datos inválidos", errors: error.errors });
      }
      console.error('Error en createGroomingService:', error);
      return res.status(500).json({ msg: 'Error al registrar el servicio de peluquería' });
    }
  };

  /* ---------- OBTENER TODOS LOS SERVICIOS DE UN PACIENTE ---------- */
  static getGroomingServicesByPatient = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ msg: 'ID de paciente inválido' });
      }

      const services = await GroomingService.find({ patientId: patientId })
        .populate({ path: 'patientId', select: 'name species breed' })
        .sort({ date: -1 });
        
      res.json({ services });
    } catch (error: any) {
      res.status(500).json({ msg: 'Error al obtener historial de servicios del paciente' });
    }
  };

  /* ---------- OBTENER TODOS LOS SERVICIOS ---------- */
  static getAllGroomingServices = async (req: Request, res: Response) => {
    try {
      const services = await GroomingService.find()
        .populate({ path: 'patientId', select: 'name species breed' })
        .sort({ date: -1 });

      res.json({ services });
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json({ msg: error.message || "Error al obtener servicios de peluquería" });
    }
  };

  /* ---------- OBTENER UNO POR ID ---------- */
  static getGroomingServiceById = async (req: Request, res: Response) => {
    try {
      const service = await GroomingService.findById(req.params.id)
        .populate({ path: 'patientId', select: 'name species breed' });
      
      if (!service) {
        return res.status(404).json({ msg: "Servicio no encontrado" });
      }
      
      res.json({ service });
    } catch (error: any) {
      console.error('Error en getGroomingServiceById:', error);
      res
        .status(500)
        .json({ msg: error.message || "Error al obtener servicio" });
    }
  };
  
  /* ---------- ACTUALIZAR SERVICIO ---------- */
  static updateGroomingService = async (req: Request, res: Response) => {
    const { id } = req.params;
    const serviceData = req.body;

    try {
      // ✅ CAMBIADO: Usa normalizeDate en lugar de la validación anterior
      if (serviceData.date) {
        serviceData.date = GroomingServiceController.normalizeDate(serviceData.date);
      }

      const updatedService = await GroomingService.findByIdAndUpdate(id, serviceData, {
        new: true,
        runValidators: true,
      }).populate({ path: 'patientId', select: 'name species breed' });

      if (!updatedService) {
        return res.status(404).json({ msg: "Servicio no encontrado" });
      }

      res.json({ 
        msg: "Servicio de peluquería actualizado correctamente", 
        service: updatedService
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: "Datos inválidos", errors: error.errors });
      }
      console.error("Error en updateGroomingService:", error);
      res.status(500).json({ msg: error.message || "Error al actualizar servicio" });
    }
  };

  /* ---------- ELIMINAR SERVICIO ---------- */
  static deleteGroomingService = async (req: Request, res: Response) => {
    try {
      const deleted = await GroomingService.findByIdAndDelete(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ msg: "Servicio no encontrado" });
      }
      
      res.json({ msg: "Servicio de peluquería eliminado correctamente" });
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json({ msg: error.message || "Error al eliminar servicio" });
    }
  };
}