// src/middleware/checkCanCreate.ts
import type { Request, Response, NextFunction } from "express";
import Veterinarian from "../models/Veterinarian";
import Patient from "../models/Patient";

export const checkCanCreate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const veterinarian = await Veterinarian.findById(req.user._id);

    if (!veterinarian) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (veterinarian.isLegacyUser) {
      return next();
    }

    if (veterinarian.planType === "basic" || veterinarian.planType === "premium") {
      return next();
    }

    if (veterinarian.planType === "trial") {
      const now = new Date();
      if (veterinarian.trialEndedAt && now > veterinarian.trialEndedAt) {
        return res.status(403).json({
          error: "Tu período de prueba ha terminado. Actualiza tu plan para continuar.",
          code: "TRIAL_EXPIRED",
        });
      }
    }

    if (!veterinarian.isActive) {
      return res.status(403).json({
        error: "Cuenta inactiva. Actualiza tu plan para continuar.",
        code: "INACTIVE_ACCOUNT",
      });
    }

    next();
  } catch (error) {
    console.error("Error en checkCanCreate:", error);
    res.status(500).json({ error: "Error al verificar permisos" });
  }
};

export const checkCanCreatePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const veterinarian = await Veterinarian.findById(req.user._id);

    if (!veterinarian) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (veterinarian.isLegacyUser) {
      return next();
    }

    if (veterinarian.planType === "basic" || veterinarian.planType === "premium") {
      return next();
    }

    if (veterinarian.planType === "trial") {
      const now = new Date();
      if (veterinarian.trialEndedAt && now > veterinarian.trialEndedAt) {
        return res.status(403).json({
          error: "Tu período de prueba ha terminado. Actualiza tu plan para continuar.",
          code: "TRIAL_EXPIRED",
        });
      }

      const patientCount = await Patient.countDocuments({ mainVet: req.user._id });

      if (patientCount >= 50) {
        return res.status(403).json({
          error: "Has alcanzado el límite de 50 pacientes. Actualiza tu plan para agregar más.",
          code: "PATIENT_LIMIT_REACHED",
        });
      }
    }

    if (!veterinarian.isActive) {
      return res.status(403).json({
        error: "Cuenta inactiva. Actualiza tu plan para continuar.",
        code: "INACTIVE_ACCOUNT",
      });
    }

    next();
  } catch (error) {
    console.error("Error en checkCanCreatePatient:", error);
    res.status(500).json({ error: "Error al verificar permisos" });
  }
};