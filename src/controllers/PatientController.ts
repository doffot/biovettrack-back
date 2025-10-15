import type { Request, Response } from "express";
import Patient from "../models/Patient";
import Owner from "../models/Owner";
import cloudinary from "../config/cloudinary";
import mongoose from "mongoose";

export class PatientController {
/* ---------- CREAR ---------- */
static createPatient = async (req: Request, res: Response) => {
  const { ownerId } = req.params;
  const patientData = req.body;

  try {
    // 1. Verificar que el Owner exista
    const owner = await Owner.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ msg: 'Dueño no encontrado' });
    }

    // 2. Convertir birthDate string → Date
    if (!patientData.birthDate) {
      return res.status(400).json({ msg: 'La fecha de nacimiento es obligatoria' });
    }
    const birthDate = new Date(patientData.birthDate);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({ msg: 'Fecha de nacimiento inválida' });
    }

    // 3. Subir imagen a Cloudinary (si hay)
    let photoUrl = null;
    if (req.file) {
      console.log('📄 Subiendo archivo:', req.file.path);
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pets',
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto'
        });
        photoUrl = result.secure_url;
        console.log('✅ Foto subida a Cloudinary:', photoUrl);
      } catch (uploadError: any) {
        console.error('❌ Error al subir a Cloudinary:', uploadError);
        return res.status(500).json({
          msg: 'Error al subir la foto',
          error: uploadError.message
        });
      }
    }

    // 4. Crear paciente
    const patient = new Patient({
      ...patientData,
      birthDate, // ← Date real
      owner: ownerId,
      photo: photoUrl
    });

    await patient.save();

    // 5. Responder con el virtual 'age' incluido
    res.status(201).json({
      msg: 'Paciente creado correctamente',
      patient: patient.toObject({ virtuals: true }) // ← incluye age
    });
  } catch (error: any) {
    console.error('Error en createPatient:', error);
    return res.status(500).json({ msg: 'Error al crear el paciente' });
  }
};
 static getAllPatient = async (req: Request, res: Response) => {
  try {
    // ✅ Sin populate de labExams por ahora
    const patients = await Patient.find();
    res.json(patients);
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ msg: error.message || "Error al obtener pacientes" });
  }
};

  /* ---------- OBTENER UNO ---------- */
  static getPatientById = async (req: Request, res: Response) => {
  try {
    const patient = await Patient.findById(req.params.id)
      
    
    if (!patient) {
      res.status(404).json({ msg: "Paciente no encontrado" });
      return;
    }
    
    console.log('Patient con owner:', patient); // Para debug
    res.json(patient);
  } catch (error: any) {
    console.error('Error en getPatientById:', error);
    res
      .status(500)
      .json({ msg: error.message || "Error al obtener paciente" });
  }
};
  // static getPatientById = async (req: Request, res: Response) => {
  //   try {
  //     const patient = await Patient.findById(req.params.id)
      
  //     if (!patient) {
  //       res.status(404).json({ msg: "Paciente no encontrado" });
  //       return;
  //     }
  //     res.json(patient); // Aquí sí devolvemos datos porque es vista detalle
  //   } catch (error: any) {
  //     console.error(error);
  //     res
  //       .status(500)
  //       .json({ msg: error.message || "Error al obtener paciente" });
  //   }
  // };

 
  /* ---------- ELIMINAR ---------- */
  static deletePatient = async (req: Request, res: Response) => {
    try {
      const deleted = await Patient.findByIdAndDelete(req.params.id);
      if (!deleted) {
        res.status(404).json({ msg: "Paciente no encontrado" });
        return;
      }
      res.json({ msg: "Paciente eliminado correctamente" });
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json({ msg: error.message || "Error al eliminar paciente" });
    }
  };

  /* ---------- BUSCAR POR DUEÑO ---------- */
  static getPatientsByOwner = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ msg: 'ID inválido' });
    }

    const patients = await Patient.find({ owner: ownerId }).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error: any) {
    res.status(500).json({ msg: 'Error al obtener mascotas' });
  }
};


 /* ✅ NUEVO: ACTUALIZAR PACIENTE */
  static updatePatient = async (req: Request, res: Response) => {
    const { id } = req.params;
    const patientData = req.body;console.log('📁 req.file:', req.file); // Si es undefined → multer no está en la ruta
console.log('📦 req.body:', req.body);

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
            await cloudinary.uploader.destroy(`pets/${publicId}`);
          }
        }
        
        
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pets',
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto'
        });
        patientData.photo = result.secure_url;
      }
      
      
      const updatedPatient = await Patient.findByIdAndUpdate(id, patientData, {
        new: true,
        runValidators: true,
      });

      if (!updatedPatient) {
        return res.status(404).json({ msg: "Paciente no encontrado" });
      }

      // 5. Respond with the updated patient object
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
