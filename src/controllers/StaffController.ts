// src/controllers/StaffController.ts
import type { Request, Response } from "express";
import Staff from "../models/Staff";
import mongoose from "mongoose";

export class StaffController {
  /* ---------- CREAR NUEVO STAFF ---------- */
  static createStaff = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const staffData = req.body;

      // Proteger campos sensibles
      delete staffData.isOwner;
      delete staffData.veterinarianId;

      const staff = new Staff({
        ...staffData,
        veterinarianId: req.user._id, // 👈 Asignar al veterinario autenticado
        active: staffData.active !== undefined ? staffData.active : true,
      });

      await staff.save();

      res.status(201).json({
        msg: "Miembro del staff creado correctamente",
        staff,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ msg: "Datos inválidos", errors: error.errors });
      }
      console.error("Error en createStaff:", error);
      return res.status(500).json({ msg: "Error al crear el miembro del staff" });
    }
  };

  /* ---------- OBTENER TODOS LOS MIEMBROS DEL STAFF DEL VETERINARIO ACTUAL ---------- */
  static getStaffList = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      // 👇 Filtrar SOLO por el veterinarianId del usuario autenticado
      const staffList = await Staff.find({
        veterinarianId: req.user._id
      }).sort({ createdAt: -1 });

      res.json({ staff: staffList });
    } catch (error: any) {
      console.error("Error en getStaffList:", error);
      return res.status(500).json({ msg: "Error al obtener la lista de staff" });
    }
  };

  /* ---------- OBTENER STAFF POR ID (solo si pertenece al veterinario actual) ---------- */
  static getStaffById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID de staff inválido" });
      }

      // 👇 Buscar SOLO si pertenece al veterinario autenticado
      const staff = await Staff.findOne({
        _id: id,
        veterinarianId: req.user._id
      });

      if (!staff) {
        return res.status(404).json({ msg: "Miembro del staff no encontrado" });
      }

      res.json({ staff });
    } catch (error: any) {
      console.error("Error en getStaffById:", error);
      return res.status(500).json({ msg: "Error al obtener el staff" });
    }
  };

  /* ---------- ACTUALIZAR STAFF (solo si pertenece al veterinario actual) ---------- */
  static updateStaff = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { id } = req.params;
      const staffData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID de staff inválido" });
      }

      // Proteger campos sensibles
      delete staffData._id;
      delete staffData.isOwner;
      delete staffData.veterinarianId;

      // 👇 Actualizar SOLO si pertenece al veterinario autenticado
      const staff = await Staff.findOneAndUpdate(
        {
          _id: id,
          veterinarianId: req.user._id
        },
        staffData,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!staff) {
        return res.status(404).json({ msg: "Miembro del staff no encontrado" });
      }

      res.json({
        msg: "Miembro del staff actualizado correctamente",
        staff,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ msg: "Datos inválidos", errors: error.errors });
      }
      console.error("Error en updateStaff:", error);
      return res.status(500).json({ msg: "Error al actualizar el staff" });
    }
  };

  /* ---------- ELIMINAR STAFF (solo si pertenece al veterinario actual) ---------- */
  static deleteStaff = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID de staff inválido" });
      }

      // 👇 Eliminar SOLO si pertenece al veterinario autenticado
      const staff = await Staff.findOneAndDelete({
        _id: id,
        veterinarianId: req.user._id,
      });

      if (!staff) {
        return res.status(404).json({ msg: "Miembro del staff no encontrado" });
      }

      // Proteger al dueño
      if (staff.isOwner) {
        return res.status(403).json({ msg: "No puedes eliminar al dueño de la clínica" });
      }

      res.json({ msg: "Miembro del staff eliminado correctamente" });
    } catch (error: any) {
      console.error("Error en deleteStaff:", error);
      return res.status(500).json({ msg: "Error al eliminar el staff" });
    }
  };
}