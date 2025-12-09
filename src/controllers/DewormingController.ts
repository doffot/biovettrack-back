// src/controllers/DewormingController.ts
import type { Request, Response } from "express";
import Deworming from "../models/Deworming";
import Patient from "../models/Patient";
import Invoice from "../models/Invoice"; // 👈 Para facturas

export class DewormingController {
  /* ---------- CREAR DESPARASITACIÓN ---------- */
  static createDeworming = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const dewormingData = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      if (!patientId) {
        return res.status(400).json({ msg: 'ID de paciente es obligatorio' });
      }

      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id
      });
      
      if (!patient) {
        return res.status(404).json({ msg: 'Paciente no encontrado o no autorizado' });
      }

      const deworming = new Deworming({
        ...dewormingData,
        patientId,
        veterinarianId: req.user._id,
      });

      await deworming.save();

      //  CREAR FACTURA AUTOMÁTICA
      try {
        const invoice = new Invoice({
          ownerId: patient.owner,
          patientId: patientId,
          items: [{
            type: "producto",
            resourceId: deworming._id,
            description: `Desparasitación ${deworming.dewormingType} - ${deworming.productName}`,
            cost: deworming.cost,
            quantity: 1,
          }],
          currency: "USD",
          total: deworming.cost,
          amountPaid: 0,
          paymentStatus: "Pendiente",
          date: new Date(),
          veterinarianId: req.user._id,
        });
        await invoice.save();
      } catch (invoiceError) {
        console.error(" Error al crear factura para desparasitación:", invoiceError);
      }

      res.status(201).json({
        msg: 'Desparasitación registrada correctamente',
        deworming,
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: error.message });
      }
      console.error('Error en createDeworming:', error);
      res.status(500).json({ msg: 'Error al registrar la desparasitación' });
    }
  };

  /* ---------- OBTENER TODAS LAS DESPARASITACIONES DEL VETERINARIO ---------- */
static getAllDewormings = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: 'Usuario no autenticado' });
    }

    // Obtener todos los pacientes del veterinario
    const patients = await Patient.find({ mainVet: req.user._id }).select('_id');
    const patientIds = patients.map(p => p._id);

    // Obtener todas las desparasitaciones de esos pacientes
    const dewormings = await Deworming.find({ 
      patientId: { $in: patientIds } 
    })
      .populate('patientId', 'name species breed')
      .sort({ applicationDate: -1 });

    res.json({ dewormings });
  } catch (error: any) {
    console.error('Error en getAllDewormings:', error);
    res.status(500).json({ msg: 'Error al obtener desparasitaciones' });
  }
};

  /* ---------- OBTENER POR PACIENTE ---------- */
  static getDewormingsByPatient = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const { patientId } = req.params;

      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(404).json({ msg: 'Paciente no encontrado o no autorizado' });
      }

      const dewormings = await Deworming.find({ patientId })
        .sort({ applicationDate: -1 });

      res.json({ dewormings });
    } catch (error: any) {
      console.error('Error en getDewormingsByPatient:', error);
      res.status(500).json({ msg: 'Error al obtener historial de desparasitación' });
    }
  };

  /* ---------- OBTENER POR ID ---------- */
  static getDewormingById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const deworming = await Deworming.findById(req.params.id);
      if (!deworming) {
        return res.status(404).json({ msg: "Desparasitación no encontrada" });
      }

      const patient = await Patient.findOne({
        _id: deworming.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para ver esta desparasitación" });
      }
      
      res.json({ deworming });
    } catch (error: any) {
      console.error('Error en getDewormingById:', error);
      res.status(500).json({ msg: 'Error al obtener desparasitación' });
    }
  };

  /* ---------- ACTUALIZAR ---------- */
  static updateDeworming = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dewormingData = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const deworming = await Deworming.findById(id);
      if (!deworming) {
        return res.status(404).json({ msg: "Desparasitación no encontrada" });
      }

      const patient = await Patient.findOne({
        _id: deworming.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para actualizar esta desparasitación" });
      }

      const updatedDeworming = await Deworming.findByIdAndUpdate(
        id,
        dewormingData,
        {
          new: true,
          runValidators: true,
        }
      );

      res.json({ 
        msg: "Desparasitación actualizada correctamente", 
        deworming: updatedDeworming
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: error.message });
      }
      console.error("Error en updateDeworming:", error);
      res.status(500).json({ msg: "Error al actualizar desparasitación" });
    }
  };

  /* ---------- ELIMINAR ---------- */
  static deleteDeworming = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const deworming = await Deworming.findById(req.params.id);
      if (!deworming) {
        return res.status(404).json({ msg: "Desparasitación no encontrada" });
      }

      const patient = await Patient.findOne({
        _id: deworming.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para eliminar esta desparasitación" });
      }

      await Deworming.findByIdAndDelete(req.params.id);
      
      res.json({ msg: "Desparasitación eliminada correctamente" });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ msg: error.message || "Error al eliminar desparasitación" });
    }
  };
}