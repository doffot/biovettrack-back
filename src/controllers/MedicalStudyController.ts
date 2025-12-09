// src/controllers/MedicalStudyController.ts
import type { Request, Response } from "express";
import MedicalStudy from "../models/MedicalStudy";
import Patient from "../models/Patient";
import cloudinary from "../config/cloudinary";
import { deleteTempPDFFile } from "../middleware/uploadPDF";

export class MedicalStudyController {
  /* ---------- CREAR ESTUDIO MÉDICO ---------- */
  static createMedicalStudy = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      if (!req.file) {
        return res.status(400).json({ msg: 'Archivo PDF requerido' });
      }

      const { patientId, professional, studyType, presumptiveDiagnosis, notes, date } = req.body;

      if (!patientId) {
        await deleteTempPDFFile(req.file.path);
        return res.status(400).json({ msg: 'ID de paciente es obligatorio' });
      }

      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id
      });
      
      if (!patient) {
        await deleteTempPDFFile(req.file.path);
        return res.status(404).json({ msg: 'Paciente no encontrado o no autorizado' });
      }

      // Subir PDF a Cloudinary
      let pdfUrl = "";
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'medical-studies',
          resource_type: 'raw',
          filename_override: `study_${Date.now()}_${patientId}`,
        });
        pdfUrl = result.secure_url;
      } catch (uploadError) {
        await deleteTempPDFFile(req.file.path);
        console.error('Error subiendo PDF:', uploadError);
        return res.status(500).json({ msg: 'Error al subir el archivo PDF' });
      }

      await deleteTempPDFFile(req.file.path);

      const medicalStudy = new MedicalStudy({
        patientId,
        veterinarianId: req.user._id,
        professional,
        studyType,
        pdfFile: pdfUrl,
        presumptiveDiagnosis,
        notes,
        date: new Date(date),
      });

      await medicalStudy.save();

      res.status(201).json({
        msg: 'Estudio médico registrado correctamente',
        study: medicalStudy,
      });

    } catch (error: any) {
      if (req.file) {
        await deleteTempPDFFile(req.file.path);
      }
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: error.message });
      }
      console.error('Error en createMedicalStudy:', error);
      res.status(500).json({ msg: 'Error al registrar el estudio médico' });
    }
  };

  /* ---------- OBTENER ESTUDIOS POR PACIENTE ---------- */
  static getStudiesByPatient = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const { patientId } = req.params;

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

      const studies = await MedicalStudy.find({ patientId })
        .sort({ date: -1 });

      res.json({ studies });
    } catch (error: any) {
      console.error('Error en getStudiesByPatient:', error);
      res.status(500).json({ msg: 'Error al obtener estudios del paciente' });
    }
  };

  /* ---------- OBTENER ESTUDIO POR ID ---------- */
  static getMedicalStudyById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const { id } = req.params;

      const study = await MedicalStudy.findById(id);
      if (!study) {
        return res.status(404).json({ msg: "Estudio no encontrado" });
      }

      // Verificar que el paciente pertenece al veterinario
      const patient = await Patient.findOne({
        _id: study.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para ver este estudio" });
      }
      
      res.json({ study });
    } catch (error: any) {
      console.error('Error en getMedicalStudyById:', error);
      res.status(500).json({ msg: 'Error al obtener el estudio' });
    }
  };

  /* ---------- ELIMINAR ESTUDIO ---------- */
  static deleteMedicalStudy = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const { id } = req.params;

      const study = await MedicalStudy.findById(id);
      if (!study) {
        return res.status(404).json({ msg: "Estudio no encontrado" });
      }

      const patient = await Patient.findOne({
        _id: study.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para eliminar este estudio" });
      }

      // Eliminar archivo de Cloudinary
      if (study.pdfFile) {
        try {
          const publicId = study.pdfFile.split('/').pop()?.split('.')[0];
          if (publicId) {
            await cloudinary.uploader.destroy(`medical-studies/${publicId}`, {
              resource_type: 'raw'
            });
          }
        } catch (cloudinaryError) {
          console.error('Error eliminando PDF de Cloudinary:', cloudinaryError);
        }
      }

      await MedicalStudy.findByIdAndDelete(id);
      
      res.json({ msg: "Estudio médico eliminado correctamente" });
    } catch (error: any) {
      console.error('Error en deleteMedicalStudy:', error);
      res.status(500).json({ msg: 'Error al eliminar el estudio' });
    }
  };
}