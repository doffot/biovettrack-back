// src/controllers/VaccinationController.ts
import type { Request, Response } from "express";
import Vaccination from "../models/Vaccination";
import Patient from "../models/Patient";
import Invoice from "../models/Invoice"; 

export class VaccinationController {
  /* ---------- CREAR VACUNA ---------- */
  static createVaccination = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const vaccinationData = req.body;

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

      const vaccination = new Vaccination({
        ...vaccinationData,
        patientId,
        veterinarianId: req.user._id,
      });

      await vaccination.save();

      //  CREAR FACTURA AUTOMÁTICA
      try {
        const invoice = new Invoice({
          ownerId: patient.owner,
          patientId: patientId,
          items: [{
            type: "vacuna",
            resourceId: vaccination._id,
            description: `${vaccination.vaccineType} - ${patient.name}`,
            cost: vaccination.cost,
            quantity: 1,
          }],
          currency: "USD",
          total: vaccination.cost,
          amountPaid: 0,
          paymentStatus: "Pendiente",
          date: new Date(),
          veterinarianId: req.user._id,
        });
        await invoice.save();
      } catch (invoiceError) {
        console.error(" Error al crear factura para vacuna:", invoiceError);
      }

      res.status(201).json({
        msg: 'Vacuna registrada correctamente',
        vaccination,
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: error.message });
      }
      console.error('Error en createVaccination:', error);
      res.status(500).json({ msg: 'Error al registrar la vacuna' });
    }
  };

 /* ---------- OBTENER VACUNAS POR PACIENTE ---------- */
  static getVaccinationsByPatient = async (req: Request, res: Response) => {
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

      const vaccinations = await Vaccination.find({ patientId })
        .sort({ vaccinationDate: -1 });

      res.json({ vaccinations });
    } catch (error: any) {
      console.error('Error en getVaccinationsByPatient:', error);
      res.status(500).json({ msg: 'Error al obtener historial de vacunas' });
    }
  };

  /* ---------- OBTENER TODAS LAS VACUNAS DEL VETERINARIO ---------- */
static getAllVaccinations = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: 'Usuario no autenticado' });
    }

    // Obtener todos los pacientes del veterinario
    const patients = await Patient.find({ mainVet: req.user._id }).select('_id');
    const patientIds = patients.map(p => p._id);

    // Obtener todas las vacunas de esos pacientes
    const vaccinations = await Vaccination.find({ 
      patientId: { $in: patientIds } 
    })
      .populate('patientId', 'name species breed')
      .sort({ vaccinationDate: -1 });

    res.json({ vaccinations });
  } catch (error: any) {
    console.error('Error en getAllVaccinations:', error);
    res.status(500).json({ msg: 'Error al obtener vacunas' });
  }
};

   /* ---------- OBTENER VACUNA POR ID ---------- */
  static getVaccinationById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const vaccination = await Vaccination.findById(req.params.id);
      if (!vaccination) {
        return res.status(404).json({ msg: "Vacuna no encontrada" });
      }

      const patient = await Patient.findOne({
        _id: vaccination.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para ver esta vacuna" });
      }
      
      res.json({ vaccination });
    } catch (error: any) {
      console.error('Error en getVaccinationById:', error);
      res.status(500).json({ msg: 'Error al obtener vacuna' });
    }
  };

/* ---------- ACTUALIZAR VACUNA ---------- */
  static updateVaccination = async (req: Request, res: Response) => {
    const { id } = req.params;
    const vaccinationData = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const vaccination = await Vaccination.findById(id);
      if (!vaccination) {
        return res.status(404).json({ msg: "Vacuna no encontrada" });
      }

      const patient = await Patient.findOne({
        _id: vaccination.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para actualizar esta vacuna" });
      }

      const updatedVaccination = await Vaccination.findByIdAndUpdate(
        id,
        vaccinationData,
        {
          new: true,
          runValidators: true,
        }
      );
          res.json({ 
        msg: "Vacuna actualizada correctamente", 
        vaccination: updatedVaccination
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: error.message });
      }
      console.error("Error en updateVaccination:", error);
      res.status(500).json({ msg: "Error al actualizar vacuna" });
    }
  };

  /* ---------- ELIMINAR VACUNA ---------- */
  static deleteVaccination = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const vaccination = await Vaccination.findById(req.params.id);
      if (!vaccination) {
        return res.status(404).json({ msg: "Vacuna no encontrada" });
      }

      const patient = await Patient.findOne({
        _id: vaccination.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para eliminar esta vacuna" });
      }

      await Vaccination.findByIdAndDelete(req.params.id);
      
      res.json({ msg: "Vacuna eliminada correctamente" });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ msg: error.message || "Error al eliminar vacuna" });
    }
  };
}