// src/controllers/ConsultationController.ts
import type { Request, Response } from "express";
import Consultation from "../models/Consultation";
import Patient from "../models/Patient";
import Invoice from "../models/Invoice";
import Appointment from "../models/Appointment";

export class ConsultationController {
  static createConsultation = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const consultationData = req.body;

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

      const consultation = new Consultation({
        ...consultationData,
        patientId,
        veterinarianId: req.user._id,
      });

      await consultation.save();

      // BUSCAR Y COMPLETAR CITA AUTOMÁTICAMENTE
      try {
        const openAppointment = await Appointment.findOne({
          patient: patientId,
          type: "Consulta",
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
          items: [{
            type: "consulta",
            resourceId: consultation._id,
            description: `Consulta - ${patient.name}`,
            cost: consultation.cost,
            quantity: 1,
          }],
          currency: "USD",
          total: consultation.cost,
          amountPaid: 0,
          paymentStatus: "Pendiente",
          date: new Date(),
          veterinarianId: req.user._id,
        });
        await invoice.save();
        console.log("✅ Factura creada:", invoice._id);
      } catch (invoiceError) {
        console.error("⚠️ Error al crear factura para consulta:", invoiceError);
      }

      res.status(201).json({
        msg: 'Consulta registrada correctamente',
        consultation,
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: error.message });
      }
      console.error('Error en createConsultation:', error);
      res.status(500).json({ msg: 'Error al registrar la consulta' });
    }
  };

  static getConsultationsByPatient = async (req: Request, res: Response) => {
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
        return res.status(404).json({ msg: 'Paciente no encontrado' });
      }

      const consultations = await Consultation.find({ patientId })
        .sort({ consultationDate: -1 });

      res.json({ consultations });
    } catch (error: any) {
      console.error('Error en getConsultationsByPatient:', error);
      res.status(500).json({ msg: 'Error al obtener consultas' });
    }
  };

  static getConsultationById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const consultation = await Consultation.findById(req.params.id);
      if (!consultation) {
        return res.status(404).json({ msg: "Consulta no encontrada" });
      }

      const patient = await Patient.findOne({
        _id: consultation.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No autorizado" });
      }
      
      res.json({ consultation });
    } catch (error: any) {
      console.error('Error en getConsultationById:', error);
      res.status(500).json({ msg: 'Error al obtener consulta' });
    }
  };

  static getAllConsultations = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const patients = await Patient.find({ mainVet: req.user._id }).select('_id');
      const patientIds = patients.map(p => p._id);

      const consultations = await Consultation.find({ 
        patientId: { $in: patientIds } 
      })
        .populate('patientId', 'name species breed')
        .sort({ consultationDate: -1 });

      res.json({ consultations });
    } catch (error: any) {
      console.error('Error en getAllConsultations:', error);
      res.status(500).json({ msg: 'Error al obtener consultas' });
    }
  };

  static updateConsultation = async (req: Request, res: Response) => {
    const { id } = req.params;
    const consultationData = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const consultation = await Consultation.findById(id);
      if (!consultation) {
        return res.status(404).json({ msg: "Consulta no encontrada" });
      }

      const patient = await Patient.findOne({
        _id: consultation.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No autorizado" });
      }

      const updated = await Consultation.findByIdAndUpdate(
        id,
        consultationData,
        { new: true, runValidators: true }
      );

      res.json({ 
        msg: "Consulta actualizada", 
        consultation: updated 
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: error.message });
      }
      console.error("Error en updateConsultation:", error);
      res.status(500).json({ msg: "Error al actualizar consulta" });
    }
  };

  static deleteConsultation = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const consultation = await Consultation.findById(req.params.id);
      if (!consultation) {
        return res.status(404).json({ msg: "Consulta no encontrada" });
      }

      const patient = await Patient.findOne({
        _id: consultation.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No autorizado" });
      }

      await Consultation.findByIdAndDelete(req.params.id);
      res.json({ msg: "Consulta eliminada" });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ msg: "Error al eliminar consulta" });
    }
  };
}