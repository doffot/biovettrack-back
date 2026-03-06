// src/controllers/LabExamController.ts
import type { Request, Response } from "express";
import { LabExamService } from "../services/LabExamService";

export class LabExamController {
  
  static createLabExam = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }
      const result = await LabExamService.create(req.body, req.user._id.toString());
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error en createLabExam:", error);
      res.status(500).json({ msg: error.message || "Error al crear el examen" });
    }
  };

  static getAllLabExams = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }
      const examType = req.query.examType as string | undefined;
      const result = await LabExamService.getAll(req.user._id.toString(), examType);
      res.json(result);
    } catch (error: any) {
      console.error("Error en getAllLabExams:", error);
      res.status(500).json({ msg: "Error al obtener exámenes" });
    }
  };

  static getLabExamById = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }
      const result = await LabExamService.getById(req.params.id, req.user._id.toString());
      if (!result) {
        return res.status(404).json({ msg: "Examen no encontrado" });
      }
      res.json(result);
    } catch (error: any) {
      console.error("Error en getLabExamById:", error);
      res.status(500).json({ msg: "Error al obtener examen" });
    }
  };

  static updateLabExam = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }
      const result = await LabExamService.update(req.params.id, req.body, req.user._id.toString());
      res.json({ msg: "Examen actualizado correctamente", labExam: result });
    } catch (error: any) {
      console.error("Error en updateLabExam:", error);
      const status = error.message === "Examen no encontrado" ? 404 : 500;
      res.status(status).json({ msg: error.message || "Error al actualizar" });
    }
  };

  static deleteLabExam = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }
      await LabExamService.delete(req.params.id, req.user._id.toString());
      res.json({ msg: "Examen eliminado correctamente" });
    } catch (error: any) {
      console.error("Error en deleteLabExam:", error);
      const status = error.message === "Examen no encontrado" ? 404 : 500;
      res.status(status).json({ msg: error.message || "Error al eliminar" });
    }
  };

  static getLabExamsByPatient = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }
      const examType = req.query.examType as string | undefined;
      const result = await LabExamService.getByPatient(
        req.params.patientId, 
        req.user._id.toString(), 
        examType
      );
      res.json(result);
    } catch (error: any) {
      console.error("Error en getLabExamsByPatient:", error);
      res.status(500).json({ msg: "Error al obtener exámenes" });
    }
  };
}