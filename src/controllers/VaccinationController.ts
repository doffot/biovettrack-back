// src/controllers/VaccinationController.ts
import type { Request, Response } from "express";
import Vaccination from "../models/Vaccination";
import Patient from "../models/Patient";
import Invoice from "../models/Invoice";
import Appointment from "../models/Appointment";

export class VaccinationController {
  /* ---------- CREAR VACUNA ---------- */
  static createVaccination = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const data = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      if (!patientId) {
        return res.status(400).json({ msg: "ID de paciente es obligatorio" });
      }

      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id,
      });

      if (!patient) {
        return res.status(404).json({ msg: "Paciente no encontrado o no autorizado" });
      }

      const vaccination = new Vaccination({
        ...data,
        patientId,
        veterinarianId: req.user._id,
      });

      await vaccination.save();

      // BUSCAR Y COMPLETAR CITA AUTOMÁTICAMENTE
      try {
        const openAppointment = await Appointment.findOne({
          patient: patientId,
          type: "Vacuna",
          status: "Programada",
        }).sort({ date: 1 });

        if (openAppointment) {
          openAppointment.status = "Completada";
          await openAppointment.save();
          console.log(`✅ Cita ${openAppointment._id} marcada como Completada`);
        }
      } catch (appointmentError) {
        console.error("⚠️ Error al buscar/actualizar cita:", appointmentError);
      }

      // CREAR FACTURA AUTOMÁTICA
      try {
        const invoice = new Invoice({
          ownerId: patient.owner,
          patientId: patientId,
          items: [
            {
              type: "vacuna",
              resourceId: vaccination._id,
              description: `${vaccination.vaccineType} - ${patient.name}`,
              cost: vaccination.cost,
              quantity: 1,
            },
          ],
          currency: "USD",
          total: vaccination.cost,
          amountPaid: 0,
          paymentStatus: "Pendiente",
          date: new Date(),
          veterinarianId: req.user._id,
        });
        await invoice.save();
        console.log("✅ Factura creada:", invoice._id);
      } catch (invoiceError) {
        console.error("⚠️ Error al crear factura para vacuna:", invoiceError);
      }

      res.status(201).json({
        msg: "Vacuna registrada correctamente",
        vaccination,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ msg: error.message });
      }
      console.error("Error en createVaccination:", error);
      res.status(500).json({ msg: "Error al registrar la vacuna" });
    }
  };

  /* ---------- OBTENER VACUNAS POR PACIENTE ---------- */
  static getVaccinationsByPatient = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { patientId } = req.params;

      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id,
      });

      if (!patient) {
        return res.status(404).json({ msg: "Paciente no encontrado o no autorizado" });
      }

      const vaccinations = await Vaccination.find({ patientId }).sort({
        vaccinationDate: -1,
      });

      res.json({ vaccinations });
    } catch (error: any) {
      console.error("Error en getVaccinationsByPatient:", error);
      res.status(500).json({ msg: "Error al obtener historial de vacunas" });
    }
  };

  /* ---------- OBTENER TODAS LAS VACUNAS DEL VETERINARIO ---------- */
  static getAllVaccinations = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const vaccinations = await Vaccination.find({
        veterinarianId: req.user._id,
      })
        .populate("patientId", "name species breed")
        .sort({ vaccinationDate: -1 });

      res.json({ vaccinations });
    } catch (error: any) {
      console.error("Error en getAllVaccinations:", error);
      res.status(500).json({ msg: "Error al obtener vacunas" });
    }
  };

  /* ---------- OBTENER VACUNA POR ID ---------- */
  static getVaccinationById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const vaccination = await Vaccination.findOne({
        _id: req.params.id,
        veterinarianId: req.user._id,
      });

      if (!vaccination) {
        return res.status(404).json({ msg: "Vacuna no encontrada o no autorizada" });
      }

      res.json({ vaccination });
    } catch (error: any) {
      console.error("Error en getVaccinationById:", error);
      res.status(500).json({ msg: "Error al obtener vacuna" });
    }
  };

  /* ---------- ACTUALIZAR VACUNA ---------- */
  static updateVaccination = async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const existingVaccination = await Vaccination.findOne({
        _id: id,
        veterinarianId: req.user._id,
      });

      if (!existingVaccination) {
        return res.status(404).json({ msg: "Vacuna no encontrada o no autorizada" });
      }

      const updatedVaccination = await Vaccination.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });

      res.json({
        msg: "Vacuna actualizada correctamente",
        vaccination: updatedVaccination,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
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
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const vaccination = await Vaccination.findOneAndDelete({
        _id: req.params.id,
        veterinarianId: req.user._id,
      });

      if (!vaccination) {
        return res.status(404).json({ msg: "Vacuna no encontrada o no autorizada" });
      }

      res.json({ msg: "Vacuna eliminada correctamente" });
    } catch (error: any) {
      console.error("Error en deleteVaccination:", error);
      res.status(500).json({ msg: "Error al eliminar vacuna" });
    }
  };
}