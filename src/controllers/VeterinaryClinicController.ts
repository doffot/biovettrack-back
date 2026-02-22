// src/controllers/VeterinaryClinicController.ts
import type { Request, Response } from "express";
import VeterinaryClinic from "../models/VeterinaryClinic";
import cloudinary from "../config/cloudinary";
import fs from "fs/promises";

export class VeterinaryClinicController {
  /* ══════════════════════════════════════════
     CREAR CLÍNICA
     ══════════════════════════════════════════ */
  static createClinic = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      // Verificar si ya existe una clínica para este veterinario
      const existingClinic = await VeterinaryClinic.findOne({
        veterinarian: req.user._id,
      });

      if (existingClinic) {
        return res.status(400).json({
          msg: "Ya tienes una clínica registrada. Puedes editarla en lugar de crear una nueva.",
        });
      }

      const clinicData = req.body;

      // Subir logo si viene archivo
      let logoUrl = null;
      if (req.file) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "clinic-logos",
            resource_type: "image",
            transformation: [
              { width: 500, height: 500, crop: "limit" },
              { quality: "auto:good" },
              { fetch_format: "auto" },
            ],
          });
          logoUrl = result.secure_url;

          await fs.unlink(req.file.path);
        } catch (uploadError: any) {
          try {
            await fs.unlink(req.file.path);
          } catch (cleanupError) {
            console.error("Error limpiando archivo:", cleanupError);
          }

          return res.status(500).json({
            msg: "Error al subir el logo",
            error: uploadError.message,
          });
        }
      }

      // Parsear socialMedia si viene como string JSON
      if (clinicData.socialMedia && typeof clinicData.socialMedia === "string") {
        try {
          clinicData.socialMedia = JSON.parse(clinicData.socialMedia);
        } catch {
          clinicData.socialMedia = [];
        }
      }

      // Parsear services si viene como string JSON
      if (clinicData.services && typeof clinicData.services === "string") {
        try {
          clinicData.services = JSON.parse(clinicData.services);
        } catch {
          clinicData.services = [];
        }
      }

      const clinic = new VeterinaryClinic({
        ...clinicData,
        veterinarian: req.user._id,
        logo: logoUrl,
      });

      await clinic.save();

      res.status(201).json({
        msg: "Clínica creada correctamente",
        clinic: clinic.toObject({ virtuals: true }),
      });
    } catch (error: any) {
      console.error("Error en createClinic:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          msg: "Ya existe una clínica registrada para este usuario",
        });
      }

      return res.status(500).json({ msg: "Error al crear la clínica" });
    }
  };

  /* ══════════════════════════════════════════
     OBTENER MI CLÍNICA
     ══════════════════════════════════════════ */
  static getMyClinic = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const clinic = await VeterinaryClinic.findOne({
        veterinarian: req.user._id,
      });

      if (!clinic) {
        return res.status(404).json({ msg: "No tienes una clínica registrada" });
      }

      res.json({ clinic: clinic.toObject({ virtuals: true }) });
    } catch (error: any) {
      console.error("Error en getMyClinic:", error);
      res.status(500).json({ msg: "Error al obtener la clínica" });
    }
  };

  /* ══════════════════════════════════════════
     OBTENER CLÍNICA POR ID
     ══════════════════════════════════════════ */
  static getClinicById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const clinic = await VeterinaryClinic.findById(id).populate(
        "veterinarian",
        "name lastName email"
      );

      if (!clinic) {
        return res.status(404).json({ msg: "Clínica no encontrada" });
      }

      res.json({ clinic: clinic.toObject({ virtuals: true }) });
    } catch (error: any) {
      console.error("Error en getClinicById:", error);
      res.status(500).json({ msg: "Error al obtener la clínica" });
    }
  };

  /* ══════════════════════════════════════════
     ACTUALIZAR CLÍNICA
     ══════════════════════════════════════════ */
  static updateClinic = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const clinic = await VeterinaryClinic.findOne({
        veterinarian: req.user._id,
      });

      if (!clinic) {
        return res.status(404).json({ msg: "No tienes una clínica registrada" });
      }

      const clinicData = req.body;

      // Subir nuevo logo si viene archivo
      if (req.file) {
        // Eliminar logo anterior
        if (clinic.logo) {
          const publicId = clinic.logo.split("/").pop()?.split(".")[0];
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(`clinic-logos/${publicId}`);
            } catch (cloudinaryError) {
              console.error("Error eliminando logo anterior:", cloudinaryError);
            }
          }
        }

        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "clinic-logos",
            resource_type: "image",
            transformation: [
              { width: 500, height: 500, crop: "limit" },
              { quality: "auto:good" },
              { fetch_format: "auto" },
            ],
          });
          clinicData.logo = result.secure_url;

          await fs.unlink(req.file.path);
        } catch (uploadError: any) {
          try {
            await fs.unlink(req.file.path);
          } catch (cleanupError) {
            console.error("Error limpiando archivo:", cleanupError);
          }

          return res.status(500).json({
            msg: "Error al subir el nuevo logo",
            error: uploadError.message,
          });
        }
      }

      // Parsear socialMedia si viene como string JSON
      if (clinicData.socialMedia && typeof clinicData.socialMedia === "string") {
        try {
          clinicData.socialMedia = JSON.parse(clinicData.socialMedia);
        } catch {
          clinicData.socialMedia = [];
        }
      }

      // Parsear services si viene como string JSON
      if (clinicData.services && typeof clinicData.services === "string") {
        try {
          clinicData.services = JSON.parse(clinicData.services);
        } catch {
          clinicData.services = [];
        }
      }

      const updatedClinic = await VeterinaryClinic.findByIdAndUpdate(
        clinic._id,
        clinicData,
        {
          new: true,
          runValidators: true,
        }
      );

      res.json({
        msg: "Clínica actualizada correctamente",
        clinic: updatedClinic?.toObject({ virtuals: true }),
      });
    } catch (error: any) {
      console.error("Error en updateClinic:", error);
      res.status(500).json({ msg: "Error al actualizar la clínica" });
    }
  };

  /* ══════════════════════════════════════════
     ELIMINAR CLÍNICA
     ══════════════════════════════════════════ */
  static deleteClinic = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const clinic = await VeterinaryClinic.findOne({
        veterinarian: req.user._id,
      });

      if (!clinic) {
        return res.status(404).json({ msg: "No tienes una clínica registrada" });
      }

      // Eliminar logo de Cloudinary
      if (clinic.logo) {
        const publicId = clinic.logo.split("/").pop()?.split(".")[0];
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(`clinic-logos/${publicId}`);
          } catch (cloudinaryError) {
            console.error("Error eliminando logo:", cloudinaryError);
          }
        }
      }

      await VeterinaryClinic.findByIdAndDelete(clinic._id);

      res.json({ msg: "Clínica eliminada correctamente" });
    } catch (error: any) {
      console.error("Error en deleteClinic:", error);
      res.status(500).json({ msg: "Error al eliminar la clínica" });
    }
  };

  /* ══════════════════════════════════════════
     ELIMINAR SOLO EL LOGO
     ══════════════════════════════════════════ */
  static deleteLogo = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const clinic = await VeterinaryClinic.findOne({
        veterinarian: req.user._id,
      });

      if (!clinic) {
        return res.status(404).json({ msg: "No tienes una clínica registrada" });
      }

      if (!clinic.logo) {
        return res.status(400).json({ msg: "La clínica no tiene logo" });
      }

      // Eliminar de Cloudinary
      const publicId = clinic.logo.split("/").pop()?.split(".")[0];
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(`clinic-logos/${publicId}`);
        } catch (cloudinaryError) {
          console.error("Error eliminando logo:", cloudinaryError);
        }
      }

      // Actualizar en BD
      clinic.logo = undefined;
      await clinic.save();

      res.json({ msg: "Logo eliminado correctamente" });
    } catch (error: any) {
      console.error("Error en deleteLogo:", error);
      res.status(500).json({ msg: "Error al eliminar el logo" });
    }
  };
}