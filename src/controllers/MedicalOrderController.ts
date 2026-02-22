// src/controllers/MedicalOrderController.ts
import type { Request, Response } from "express";
import MedicalOrder from "../models/MedicalOrder";
import Patient from "../models/Patient";

export class MedicalOrderController {
  /* ---------- CREAR ORDEN MÉDICA ---------- */
  static createMedicalOrder = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const orderData = req.body;

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

      // Validar que tenga al menos un estudio
      if (!orderData.studies || orderData.studies.length === 0) {
        return res.status(400).json({ msg: "Debe incluir al menos un estudio" });
      }

      const medicalOrder = new MedicalOrder({
        ...orderData,
        patientId,
        veterinarianId: req.user._id,
        issueDate: orderData.issueDate || new Date(),
      });

      await medicalOrder.save();

      res.status(201).json({
        msg: "Orden médica creada correctamente",
        medicalOrder,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ msg: error.message });
      }
      console.error("Error en createMedicalOrder:", error);
      res.status(500).json({ msg: "Error al crear la orden médica" });
    }
  };

  /* ---------- OBTENER ÓRDENES POR PACIENTE ---------- */
  static getMedicalOrdersByPatient = async (req: Request, res: Response) => {
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

      const medicalOrders = await MedicalOrder.find({ patientId })
        .populate("consultationId", "consultationDate reasonForVisit")
        .sort({ issueDate: -1 });

      res.json({ medicalOrders });
    } catch (error: any) {
      console.error("Error en getMedicalOrdersByPatient:", error);
      res.status(500).json({ msg: "Error al obtener órdenes médicas" });
    }
  };

  /* ---------- OBTENER TODAS LAS ÓRDENES DEL VETERINARIO ---------- */
  static getAllMedicalOrders = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const medicalOrders = await MedicalOrder.find({ veterinarianId: req.user._id })
        .populate("patientId", "name species breed")
        .populate("consultationId", "consultationDate reasonForVisit")
        .sort({ issueDate: -1 });

      res.json({ medicalOrders });
    } catch (error: any) {
      console.error("Error en getAllMedicalOrders:", error);
      res.status(500).json({ msg: "Error al obtener órdenes médicas" });
    }
  };

  /* ---------- OBTENER ORDEN POR ID ---------- */
  static getMedicalOrderById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const medicalOrder = await MedicalOrder.findById(req.params.id)
        .populate("patientId", "name species breed owner")
        .populate("consultationId", "consultationDate reasonForVisit");

      if (!medicalOrder) {
        return res.status(404).json({ msg: "Orden médica no encontrada" });
      }

      // Verificar que el veterinario sea el dueño de la orden
      if (medicalOrder.veterinarianId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: "No tienes permiso para ver esta orden" });
      }

      res.json({ medicalOrder });
    } catch (error: any) {
      console.error("Error en getMedicalOrderById:", error);
      res.status(500).json({ msg: "Error al obtener orden médica" });
    }
  };

  /* ---------- ACTUALIZAR ORDEN MÉDICA ---------- */
  static updateMedicalOrder = async (req: Request, res: Response) => {
    const { id } = req.params;
    const orderData = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const medicalOrder = await MedicalOrder.findById(id);
      if (!medicalOrder) {
        return res.status(404).json({ msg: "Orden médica no encontrada" });
      }

      // Verificar autorización
      if (medicalOrder.veterinarianId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: "No tienes permiso para actualizar esta orden" });
      }

      // Validar estudios si se envían
      if (orderData.studies && orderData.studies.length === 0) {
        return res.status(400).json({ msg: "Debe incluir al menos un estudio" });
      }

      const updatedOrder = await MedicalOrder.findByIdAndUpdate(id, orderData, {
        new: true,
        runValidators: true,
      })
        .populate("patientId", "name species breed")
        .populate("consultationId", "consultationDate reasonForVisit");

      res.json({
        msg: "Orden médica actualizada correctamente",
        medicalOrder: updatedOrder,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ msg: error.message });
      }
      console.error("Error en updateMedicalOrder:", error);
      res.status(500).json({ msg: "Error al actualizar orden médica" });
    }
  };

  /* ---------- ELIMINAR ORDEN MÉDICA ---------- */
  static deleteMedicalOrder = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const medicalOrder = await MedicalOrder.findById(req.params.id);
      if (!medicalOrder) {
        return res.status(404).json({ msg: "Orden médica no encontrada" });
      }

      // Verificar autorización
      if (medicalOrder.veterinarianId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: "No tienes permiso para eliminar esta orden" });
      }

      await MedicalOrder.findByIdAndDelete(req.params.id);

      res.json({ msg: "Orden médica eliminada correctamente" });
    } catch (error: any) {
      console.error("Error en deleteMedicalOrder:", error);
      res.status(500).json({ msg: error.message || "Error al eliminar orden médica" });
    }
  };
}