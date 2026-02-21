import type { Request, Response } from "express";
import MedicalStudy from "../models/MedicalStudy";
import Patient from "../models/Patient";
import cloudinary from "../config/cloudinary";
import fs from "fs/promises";
import { deleteTempPDFFile } from "../middleware/uploadPDF";

export class MedicalStudyController {
  
  /* ---------- CREAR (SUBIR PDF) ---------- */
  static createMedicalStudy = async (req: Request, res: Response) => {
    // 1. El ID viene en la URL
    const { patientId } = req.params;
    // 2. Los datos de texto vienen en el body (gracias a Multer)
    const { professional, studyType, presumptiveDiagnosis, notes, date } = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      // Validar archivo
      if (!req.file) {
        return res.status(400).json({ msg: "El archivo PDF es obligatorio" });
      }

      // Validar Paciente y Pertenencia
      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        await deleteTempPDFFile(req.file.path);
        return res.status(404).json({ msg: "Paciente no encontrado o no autorizado" });
      }

      let pdfUrl = "";

      // Subir a Cloudinary
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'medical-studies',
          resource_type: 'raw',
          filename_override: `study_${Date.now()}_${patientId}`,
        });
       
        
        pdfUrl = result.secure_url;
        
        // Limpiar temporal
        await deleteTempPDFFile(req.file.path);

      } catch (uploadError) {
        console.error("Error Cloudinary:", uploadError);
        await deleteTempPDFFile(req.file.path);
        return res.status(500).json({ msg: "Error al subir el archivo a la nube" });
      }

      // Guardar en BD
      const medicalStudy = new MedicalStudy({
        patientId,
        veterinarianId: req.user._id,
        professional,
        studyType,
        date: new Date(date),
        presumptiveDiagnosis,
        notes,
        pdfFile: pdfUrl
      });

      await medicalStudy.save();

      res.status(201).json({ 
        msg: "Estudio médico registrado correctamente", 
        study: medicalStudy 
      });

    } catch (error) {
      console.error("Error createMedicalStudy:", error);
      if (req.file) await deleteTempPDFFile(req.file.path);
      res.status(500).json({ msg: "Error al registrar el estudio médico" });
    }
  };

  /* ---------- OBTENER POR PACIENTE ---------- */
  static getStudiesByPatient = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    try {
      if (!req.user) return res.status(401).json({ msg: "No autorizado" });

      // Validar acceso al paciente
      const patient = await Patient.findOne({ _id: patientId, mainVet: req.user._id });
      if (!patient) return res.status(404).json({ msg: "Paciente no encontrado" });

      const studies = await MedicalStudy.find({ patientId })
        .sort({ date: -1 });
      
      res.json({ studies });
    } catch (error) {
      res.status(500).json({ msg: "Error al obtener estudios" });
    }
  };

  /* ---------- OBTENER POR ID ---------- */
  static getMedicalStudyById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const study = await MedicalStudy.findOne({
        _id: id,
        veterinarianId: req.user._id
      });

      if (!study) {
        return res.status(404).json({ msg: "Estudio no encontrado" });
      }
      res.json({ study });
    } catch (error) {
      res.status(500).json({ msg: "Error al obtener el estudio" });
    }
  };

  /* ---------- ELIMINAR ---------- */
  static deleteMedicalStudy = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const study = await MedicalStudy.findOneAndDelete({
        _id: id,
        veterinarianId: req.user._id
      });

      if (!study) {
        return res.status(404).json({ msg: "Estudio no encontrado" });
      }

      // Intentar eliminar de Cloudinary (opcional, limpieza)
      // Se requiere extraer el public_id de la URL o haberlo guardado
      
      res.json({ msg: "Estudio eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ msg: "Error al eliminar estudio" });
    }
  };
}