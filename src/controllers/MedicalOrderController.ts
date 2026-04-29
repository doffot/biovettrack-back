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
      if (!req.user?._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      // Verificar que el paciente exista y pertenezca al veterinario
      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id,
      });

      if (!patient) {
        return res.status(404).json({ msg: "Paciente no encontrado o no autorizado" });
      }

      // Validar que al menos una categoría tenga algún examen seleccionado o haya un examen especial
      const categories = [
        'hematology', 'coprology', 'urinalysis', 'cytology', 
        'hormonal', 'skin', 'chemistry', 'cultures', 'antigenicTests'
      ];
      
      const hasSelectedExams = categories.some(cat => 
        Array.isArray(orderData[cat]) && orderData[cat].length > 0
      );

      if (!hasSelectedExams && !orderData.specialExams) {
        return res.status(400).json({ msg: "Debe seleccionar al menos un examen médico" });
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
    const { patientId } = req.params;

    try {
      if (!req.user?._id) return res.status(401).json({ msg: "No autorizado" });

      // Validamos propiedad del paciente antes de soltar las órdenes
      const patient = await Patient.findOne({ _id: patientId, mainVet: req.user._id });
      if (!patient) return res.status(404).json({ msg: "Paciente no encontrado" });

      const medicalOrders = await MedicalOrder.find({ patientId })
        .sort({ issueDate: -1 });

      res.json({ medicalOrders });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Error al obtener órdenes del paciente" });
    }
  };

  /* ---------- OBTENER TODAS LAS ÓRDENES DEL VETERINARIO ---------- */
  static getAllMedicalOrders = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) return res.status(401).json({ msg: "No autorizado" });

      const medicalOrders = await MedicalOrder.find({ veterinarianId: req.user._id })
        .populate("patientId", "name species breed")
        .sort({ issueDate: -1 });

      res.json({ medicalOrders });
    } catch (error) {
      res.status(500).json({ msg: "Error al obtener todas las órdenes" });
    }
  };

  /* ---------- OBTENER ORDEN POR ID ---------- */
  static getMedicalOrderById = async (req: Request, res: Response) => {
    try {
      const medicalOrder = await MedicalOrder.findById(req.params.id)
        .populate("patientId", "name species breed owner");

      if (!medicalOrder) {
        return res.status(404).json({ msg: "Orden médica no encontrada" });
      }

      if (medicalOrder.veterinarianId.toString() !== req.user?._id.toString()) {
        return res.status(403).json({ msg: "Acceso denegado" });
      }

      res.json({ medicalOrder });
    } catch (error) {
      res.status(500).json({ msg: "Error al obtener la orden" });
    }
  };

  /* ---------- ACTUALIZAR ORDEN MÉDICA ---------- */
  static updateMedicalOrder = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const medicalOrder = await MedicalOrder.findById(id);
      
      if (!medicalOrder) return res.status(404).json({ msg: "Orden no encontrada" });

      if (medicalOrder.veterinarianId.toString() !== req.user?._id.toString()) {
        return res.status(403).json({ msg: "No autorizado para editar esta orden" });
      }

      const updatedOrder = await MedicalOrder.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      }).populate("patientId", "name species breed");

      res.json({
        msg: "Orden médica actualizada correctamente",
        medicalOrder: updatedOrder,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") return res.status(400).json({ msg: error.message });
      res.status(500).json({ msg: "Error al actualizar la orden" });
    }
  };

  /* ---------- ELIMINAR ORDEN MÉDICA ---------- */
  static deleteMedicalOrder = async (req: Request, res: Response) => {
    try {
      const medicalOrder = await MedicalOrder.findById(req.params.id);

      if (!medicalOrder) return res.status(404).json({ msg: "Orden no encontrada" });

      if (medicalOrder.veterinarianId.toString() !== req.user?._id.toString()) {
        return res.status(403).json({ msg: "No autorizado" });
      }

      await medicalOrder.deleteOne(); // Usar deleteOne para activar middlewares si los tienes
      res.json({ msg: "Orden médica eliminada correctamente" });
    } catch (error) {
      res.status(500).json({ msg: "Error al eliminar la orden" });
    }
  };
}