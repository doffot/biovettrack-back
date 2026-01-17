// src/controllers/PatientController.ts
import type { Request, Response } from "express";
import Patient from "../models/Patient";
import Owner from "../models/Owner";
import cloudinary from "../config/cloudinary";
import mongoose from "mongoose";
import fs from "fs/promises"; 
import Veterinarian from "../models/Veterinarian";

export class PatientController {
  /* ---------- CREAR ---------- */
  static createPatient = async (req: Request, res: Response) => {
    const { ownerId } = req.params;
    const patientData = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const owner = await Owner.findById(ownerId);
      if (!owner) {
        return res.status(404).json({ msg: 'Dueño no encontrado' });
      }

      if (!patientData.birthDate) {
        return res.status(400).json({ msg: 'La fecha de nacimiento es obligatoria' });
      }
      const birthDate = new Date(patientData.birthDate);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ msg: 'Fecha de nacimiento inválida' });
      }

      let photoUrl = null;
      if (req.file) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'pets',
            resource_type: 'image',
            quality: 'auto',
            fetch_format: 'auto'
          });
          photoUrl = result.secure_url;
          
          await fs.unlink(req.file.path);
          
        } catch (uploadError: any) {
          
          try {
            await fs.unlink(req.file.path);
            console.log('🧹 Archivo temporal limpiado tras error');
          } catch (cleanupError) {
            console.error('Error limpiando archivo:', cleanupError);
          }
          
          return res.status(500).json({
            msg: 'Error al subir la foto',
            error: uploadError.message
          });
        }
      }

      const patient = new Patient({
        ...patientData,
        birthDate,
        owner: ownerId,
        mainVet: req.user._id,
        photo: photoUrl
      });

      await patient.save();

      //  INCREMENTAR patientCount DEL VETERINARIO
      await Veterinarian.findByIdAndUpdate(
        req.user._id,
        { $inc: { patientCount: 1 } }
      );

      res.status(201).json({
        msg: 'Paciente creado correctamente',
        patient: patient.toObject({ virtuals: true })
      });
    } catch (error: any) {
      console.error('Error en createPatient:', error);
      return res.status(500).json({ msg: 'Error al crear el paciente' });
    }
  };

  // ACTUALIZADO: Ahora populate el owner
  static getAllPatient = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const patients = await Patient.find({
        mainVet: req.user._id
      })
      .populate("owner", "name contact") 
      .sort({ createdAt: -1 });

      res.json(patients);
    } catch (error: any) {
      console.error('Error en getAllPatient:', error);
      res.status(500).json({ msg: 'Error al obtener pacientes' });
    }
  };

  /* ---------- OBTENER UNO ---------- */
  static getPatientById = async (req: Request, res: Response) => {
    try {
      const patient = await Patient.findById(req.params.id)
        .populate("owner", "name contact"); 

      if (!patient) {
        res.status(404).json({ msg: "Paciente no encontrado" });
        return;
      }
      
      console.log('Patient con owner:', patient);
      res.json(patient);
    } catch (error: any) {
      console.error('Error en getPatientById:', error);
      res
        .status(500)
        .json({ msg: error.message || "Error al obtener paciente" });
    }
  };

  /* ---------- ELIMINAR ---------- */
  static deletePatient = async (req: Request, res: Response) => {
    try {
      const patient = await Patient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({ msg: "Paciente no encontrado" });
      }

      // DECREMENTAR patientCount DEL VETERINARIO ANTES DE ELIMINAR
      await Veterinarian.findByIdAndUpdate(
        patient.mainVet, // usa el veterinario asociado al paciente
        { $inc: { patientCount: -1 } },
        { new: false } // no necesitas el documento actualizado
      );

      if (patient.photo) {
        const publicId = patient.photo.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`pets/${publicId}`);
        }
      }

      await Patient.findByIdAndDelete(req.params.id);
      res.json({ msg: "Paciente eliminado correctamente" });
      
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ msg: error.message || "Error al eliminar paciente" });
    }
  };

  /* ---------- BUSCAR POR DUEÑO ---------- */
  static getPatientsByOwner = async (req: Request, res: Response) => {
    try {
      const { ownerId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(ownerId)) {
        return res.status(400).json({ msg: 'ID inválido' });
      }

      const patients = await Patient.find({ owner: ownerId })
        .populate("owner", "name contact") 
        .sort({ createdAt: -1 });
      res.json(patients);
    } catch (error: any) {
      res.status(500).json({ msg: 'Error al obtener mascotas' });
    }
  };

  /*  ACTUALIZAR PACIENTE */
  static updatePatient = async (req: Request, res: Response) => {
    const { id } = req.params;
    const patientData = req.body;

    try {
      const patientToUpdate = await Patient.findById(id);
      if (!patientToUpdate) {
        return res.status(404).json({ msg: "Paciente no encontrado" });
      }

      if (patientData.birthDate) {
        const birthDate = new Date(patientData.birthDate);
        if (isNaN(birthDate.getTime())) {
          return res.status(400).json({ msg: 'Fecha de nacimiento inválida' });
        }
        patientData.birthDate = birthDate;
      }

      if (req.file) {
        
        if (patientToUpdate.photo) {
          const publicId = patientToUpdate.photo.split('/').pop()?.split('.')[0];
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(`pets/${publicId}`);
            } catch (cloudinaryError) {
              console.error('Error eliminando foto anterior:', cloudinaryError);
            }
          }
        }
        
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'pets',
            resource_type: 'image',
            quality: 'auto',
            fetch_format: 'auto'
          });
          patientData.photo = result.secure_url;
         
          
          await fs.unlink(req.file.path);
          
          
        } catch (uploadError: any) {
          console.error('❌ Error al subir nueva foto:', uploadError);
          
          try {
            await fs.unlink(req.file.path);
            console.log('🧹 Archivo temporal limpiado tras error');
          } catch (cleanupError) {
            console.error('Error limpiando archivo:', cleanupError);
          }
          
          return res.status(500).json({
            msg: 'Error al subir la nueva foto',
            error: uploadError.message
          });
        }
      }
      
      const updatedPatient = await Patient.findByIdAndUpdate(id, patientData, {
        new: true,
        runValidators: true,
      })
      .populate("owner", "name contact"); 

      if (!updatedPatient) {
        return res.status(404).json({ msg: "Paciente no encontrado" });
      }

      res.json({ 
        msg: "Paciente actualizado correctamente", 
        patient: updatedPatient.toObject({ virtuals: true })
      });

    } catch (error: any) {
      console.error("Error en updatePatient:", error);
      res.status(500).json({ msg: error.message || "Error al actualizar paciente" });
    }
  };
}