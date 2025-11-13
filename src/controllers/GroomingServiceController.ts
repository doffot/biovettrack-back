// controllers/GroomingServiceController.ts
import type { Request, Response } from "express";
import GroomingService from "../models/GroomingService";
import Patient from "../models/Patient";
import PaymentMethod from "../models/PaymentMethod";
import mongoose from "mongoose";
import Owner from "../models/Owner";

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

  /* ---------- CREAR SERVICIO DE GROOMING ---------- */
  static createGroomingService = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const serviceData = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ msg: 'ID de paciente inválido' });
      }

      // Verificar que el paciente existe y pertenece al veterinario
      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id
      });
      
      if (!patient) {
        return res.status(404).json({ msg: 'Paciente no encontrado' });
      }

      // Verificar que el método de pago pertenece al veterinario
      if (serviceData.paymentMethod) {
        const paymentMethod = await PaymentMethod.findOne({
          _id: serviceData.paymentMethod,
          veterinarian: req.user._id
        });
        
        if (!paymentMethod) {
          return res.status(400).json({ msg: 'Método de pago no válido' });
        }
      }

      const groomingService = new GroomingService({
        ...serviceData,
        patientId: patientId,
        groomer: req.user._id, // El veterinario autenticado es el groomer
        date: GroomingServiceController.normalizeDate(serviceData.date),
      });

      await groomingService.save();

      // Populate para la respuesta
      const populatedService = await GroomingService.findById(groomingService._id)
        .populate('patientId')
        .populate('paymentMethod')
        .populate('groomer');

      res.status(201).json({
        msg: 'Servicio de peluquería registrado correctamente',
        service: populatedService,
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

      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ msg: 'ID de paciente inválido' });
      }

      // Verificar que el paciente pertenece al veterinario
      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(404).json({ msg: 'Paciente no encontrado' });
      }

      const services = await GroomingService.find({ patientId: patientId })
        .populate('patientId')
        .populate('paymentMethod')
        .populate('groomer')
        .sort({ date: -1 });
        
      res.json({ services });
    } catch (error: any) {
      res.status(500).json({ msg: 'Error al obtener historial de servicios del paciente' });
    }
  };

  /* ---------- OBTENER TODOS LOS SERVICIOS ---------- */
  static getAllGroomingServices = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      // Obtener pacientes del veterinario autenticado
      const patientIds = await Patient.find(
        { mainVet: req.user._id },
        '_id'
      ).distinct('_id');

      if (patientIds.length === 0) {
        return res.json({ services: [] });
      }

      // Obtener servicios de peluquería de esos pacientes
      const services = await GroomingService.find({
        patientId: { $in: patientIds }
      })
        .populate('patientId')
        .populate('paymentMethod')
        .populate('groomer')
        .sort({ date: -1 });

      res.json({ services });
    } catch (error: any) {
      console.error('Error en getAllGroomingServices:', error);
      res.status(500).json({ 
        msg: error.message || "Error al obtener servicios de peluquería" 
      });
    }
  };

  /* ---------- OBTENER UNO POR ID ---------- */
  static getGroomingServiceById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

     const service = await GroomingService.findById(req.params.id)
  .populate({
    path: 'patientId',
    populate: { path: 'owner' } 
  })
  .populate('paymentMethod')
  .populate('groomer');
      
      if (!service) {
        return res.status(404).json({ msg: "Servicio no encontrado" });
      }

      // Verificar que el servicio pertenece al veterinario
      const patient = await Patient.findOne({
        _id: service.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para ver este servicio" });
      }
      
      res.json({ service });
    } catch (error: any) {
      console.error('Error en getGroomingServiceById:', error);
      res.status(500).json({ msg: error.message || "Error al obtener servicio" });
    }
  };
  
  /* ---------- ACTUALIZAR SERVICIO ---------- */
  static updateGroomingService = async (req: Request, res: Response) => {
    const { id } = req.params;
    const serviceData = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      // Verificar que el servicio existe y pertenece al veterinario
      const existingService = await GroomingService.findById(id)
        .populate('patientId');
      
      if (!existingService) {
        return res.status(404).json({ msg: "Servicio no encontrado" });
      }

      const patient = await Patient.findOne({
        _id: existingService.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para actualizar este servicio" });
      }

      // Verificar método de pago si se está actualizando
      if (serviceData.paymentMethod) {
        const paymentMethod = await PaymentMethod.findOne({
          _id: serviceData.paymentMethod,
          veterinarian: req.user._id
        });
        
        if (!paymentMethod) {
          return res.status(400).json({ msg: 'Método de pago no válido' });
        }
      }

      // Normalizar fecha si se está actualizando
      if (serviceData.date) {
        serviceData.date = GroomingServiceController.normalizeDate(serviceData.date);
      }

      const updatedService = await GroomingService.findByIdAndUpdate(id, serviceData, {
        new: true,
        runValidators: true,
      })
        .populate('patientId')
        .populate('paymentMethod')
        .populate('groomer');

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
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      // Verificar que el servicio pertenece al veterinario
      const existingService = await GroomingService.findById(req.params.id)
        .populate('patientId');
      
      if (!existingService) {
        return res.status(404).json({ msg: "Servicio no encontrado" });
      }

      const patient = await Patient.findOne({
        _id: existingService.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para eliminar este servicio" });
      }

      const deleted = await GroomingService.findByIdAndDelete(req.params.id);
      
      res.json({ msg: "Servicio de peluquería eliminado correctamente" });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ msg: error.message || "Error al eliminar servicio" });
    }
  };
}