// src/controllers/LabExamController.ts
import type { Request, Response } from "express";
import LabExam from "../models/LabExam";
import { validateDifferentialSum } from "../utils/validateDifferentialCount";
import Patient from "../models/Patient";

export class LabExamController {
  /* ---------- CREAR ---------- */
  static createLabExam = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const data = req.body;

    try {
      // 1. Verificar que el paciente exista
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ msg: "Paciente no encontrado" });
      }

      // 2. Validar conteo diferencial (lógica de negocio que express-validator no puede hacer)
      if (data.differentialCount && !validateDifferentialSum(data.differentialCount)) {
        return res.status(400).json({
          msg: "La suma del conteo diferencial no puede superar 100",
        });
      }

      // 3. Crear examen (todos los demás campos ya están validados por express-validator)
      const labExam = new LabExam({ ...data, patientId });
      await labExam.save();

      res.status(201).json({
        msg: "Examen creado correctamente",
        labExam,
      });
    } catch (error: any) {
      console.error("Error en createLabExam:", error);
      res.status(500).json({ msg: "Error al crear el examen" });
    }
  };

  /* ---------- LISTAR TODOS DE UN PACIENTE ---------- */
  static getLabExamsByPatient = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;

      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ msg: "Paciente no encontrado" });
      }

      const exams = await LabExam.find({ patientId }).sort({ createdAt: -1 });

      res.json({
        patient,
        exams,
      });
    } catch (error: any) {
      console.error("Error en getLabExamsByPatient:", error);
      res.status(500).json({ msg: "Error al obtener exámenes del paciente" });
    }
  };

  /* ---------- OBTENER UNO (cualquier paciente) ---------- */
  // static getLabExamById = async (req: Request, res: Response) => {
  //   try {
  //     const { id } = req.params;

  //     const exam = await LabExam.findById(id).populate("patientId", "name species breed");
  //     if (!exam) {
  //       return res.status(404).json({ msg: "Examen no encontrado" });
  //     }

  //     res.json(exam);
  //   } catch (error: any) {
  //     console.error("Error en getLabExamById:", error);
  //     res.status(500).json({ msg: "Error al obtener examen" });
  //   }
  // };
  static getLabExamById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const exam = await LabExam.findById(id); // ← sin populate
    if (!exam) {
      return res.status(404).json({ msg: "Examen no encontrado" });
    }

    // ✅ Convierte patientId a string
    const examData = {
      ...exam.toObject(),
      patientId: exam.patientId.toString(),
    };

    res.json(examData);
  } catch (error: any) {
    console.error("Error en getLabExamById:", error);
    res.status(500).json({ msg: "Error al obtener examen" });
  }
};

  /* ---------- ACTUALIZAR ---------- */
  static updateLabExam = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const exam = await LabExam.findById(id);
      if (!exam) {
        return res.status(404).json({ msg: "Examen no encontrado" });
      }

      // Validar conteo diferencial si viene en la actualización
      if (data.differentialCount && !validateDifferentialSum(data.differentialCount)) {
        return res.status(400).json({
          msg: "La suma del conteo diferencial no puede superar 100",
        });
      }

      const updated = await LabExam.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });

      res.json({
        msg: "Examen actualizado correctamente",
        labExam: updated,
      });
    } catch (error: any) {
      console.error("Error en updateLabExam:", error);
      res.status(500).json({ msg: "Error al actualizar examen" });
    }
  };

  /* ---------- ELIMINAR ---------- */
  static deleteLabExam = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await LabExam.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ msg: "Examen no encontrado" });
      }

      res.json({ msg: "Examen eliminado correctamente" });
    } catch (error: any) {
      console.error("Error en deleteLabExam:", error);
      res.status(500).json({ msg: "Error al eliminar examen" });
    }
  };
}