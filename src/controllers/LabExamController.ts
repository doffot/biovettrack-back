// src/controller/LabExamController.ts
import type { Request, Response } from "express";
import LabExam from "../models/LabExam";
import { validateDifferentialSum } from "../utils/validateDifferentialCount";
import Patient from "../models/Patient";

export class LabExamController {
  /* ---------- CREAR ---------- */
  static createLabExam = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { differentialCount } = req.body;
    try {
      if (!validateDifferentialSum(differentialCount)) {
        res
          .status(400)
          .json({
            msg: "La suma del contaje diferencial no puede superar 100",
          });
        return;
      }

      const labExam = new LabExam({ ...req.body, patientId });
      await labExam.save();

      res.status(201).json({ msg: "Examen creado correctamente" });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ msg: error.message || "Error al crear examen" });
    }
  };

  /* ---------- LISTAR TODOS DE UN PACIENTE ---------- */
  static getLabExamsByPatient = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;

      // 1) traemos el paciente una sola vez
      const patient = await Patient.findById(patientId);
      if (!patient) {
        res.status(404).json({ msg: "Paciente no encontrado" });
        return;
      }

      // 2) traemos solo los exámenes (sin populate)
      const exams = await LabExam.find({ patientId });

      res.json({
        patient, // una sola vez
        exams, // sin repetir paciente adentro
      });
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json({
          msg: error.message || "Error al obtener exámenes del paciente",
        });
    }
  };
  /* ---------- OBTENER UNO (cualquier paciente) ---------- */
  static getLabExamById = async (req: Request, res: Response) => {
    try {
      const exam = await LabExam.findById(req.params.id).populate("patientId");
      if (!exam) {
        res.status(404).json({ msg: "Examen no encontrado" });
        return;
      }
      res.json(exam);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ msg: error.message || "Error al obtener examen" });
    }
  };

  /* ---------- ACTUALIZAR ---------- */
  static updateLabExam = async (req: Request, res: Response) => {
    try {
      const { differentialCount } = req.body;

      if (differentialCount && !validateDifferentialSum(differentialCount)) {
        res
          .status(400)
          .json({
            msg: "La suma del contaje diferencial no puede superar 100",
          });
        return;
      }

      const updated = await LabExam.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated) {
        res.status(404).json({ msg: "Examen no encontrado" });
        return;
      }
      res.json({ msg: "Examen actualizado correctamente" });
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json({ msg: error.message || "Error al actualizar examen" });
    }
  };

  /* ---------- ELIMINAR ---------- */
  static deleteLabExam = async (req: Request, res: Response) => {
    try {
      const deleted = await LabExam.findByIdAndDelete(req.params.id);
      if (!deleted) {
        res.status(404).json({ msg: "Examen no encontrado" });
        return;
      }
      res.json({ msg: "Examen eliminado correctamente" });
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json({ msg: error.message || "Error al eliminar examen" });
    }
  };
}
