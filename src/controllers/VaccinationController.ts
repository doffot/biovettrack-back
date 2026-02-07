// src/controllers/VaccinationController.ts
import type { Request, Response } from "express";
import Vaccination from "../models/Vaccination";
import Patient from "../models/Patient";
import Invoice from "../models/Invoice";
import Appointment from "../models/Appointment";
import Product from "../models/Product";
import Inventory from "../models/Inventory";
import InventoryMovement from "../models/InventoryMovement";

export class VaccinationController {
  /* ---------- CREAR VACUNA ---------- */
static createVaccination = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const data = req.body;

   // 👇 DEBUG: Ver qué llega del frontend
  console.log("📦 Data recibida:", JSON.stringify(data, null, 2));
  console.log("📦 PatientId:", patientId);

  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: "Usuario no autenticado" });
    }

    if (!patientId) {
      return res.status(400).json({ msg: "ID de paciente es obligatorio" });
    }

    const patient = await Patient.findOne({
      _id: patientId,
      mainVet: req.user._id,
    });

    if (!patient) {
      return res.status(404).json({ msg: "Paciente no encontrado o no autorizado" });
    }

    const isInternal = data.source === 'internal';

    // Lógica para producto del catálogo (solo interna)
    let finalCost = data.cost || 0;
    let finalVaccineType = data.vaccineType;

    if (isInternal && data.productId) {
      const product = await Product.findOne({
        _id: data.productId,
        veterinarian: req.user._id
      });
      if (!product) {
        return res.status(404).json({ msg: "Producto no encontrado o no autorizado" });
      }
      finalCost = product.salePrice;
    }

    const vaccination = new Vaccination({
      ...data,
      patientId,
      veterinarianId: req.user._id,
      vaccineType: finalVaccineType,
      cost: isInternal ? finalCost : (data.cost || 0),
    });

    await vaccination.save();

    // CONSUMIR STOCK - Solo si es INTERNA y tiene productId
    if (isInternal && data.productId) {
      const product = await Product.findOne({
        _id: data.productId,
        veterinarian: req.user._id
      });
      
      if (!product) {
        return res.status(404).json({ msg: "Producto no encontrado o no autorizado" });
      }

      // Validar que sea no divisible (vacunas normalmente no lo son)
      if (product.divisible) {
        return res.status(400).json({ 
          msg: "Las vacunas deben ser productos no divisibles. Usa unidades completas." 
        });
      }

      // Obtener inventario
      const inventory = await Inventory.findOne({
        product: data.productId,
        veterinarian: req.user._id
      });

      if (!inventory || inventory.stockUnits < 1) {
        return res.status(400).json({ 
          msg: `Stock insuficiente. Solo hay ${inventory?.stockUnits || 0} ${product.unit}(s) disponibles` 
        });
      }

      // Consumir 1 unidad completa
      inventory.stockUnits -= 1;
      inventory.lastMovement = new Date();
      await inventory.save();

      // Crear movimiento de inventario
      const movement = new InventoryMovement({
        product: data.productId,
        type: "salida",
        reason: "uso_clinico",
        quantityUnits: 1,
        quantityDoses: 0,
        stockAfterUnits: inventory.stockUnits,
        stockAfterDoses: inventory.stockDoses,
        referenceType: "Vaccination",
        referenceId: vaccination._id,
        createdBy: req.user._id,
      });
      await movement.save();
    }

    // BUSCAR Y COMPLETAR CITA AUTOMÁTICAMENTE
    try {
      const openAppointment = await Appointment.findOne({
        patient: patientId,
        type: "Vacuna",
        status: "Programada",
      }).sort({ date: 1 });

      if (openAppointment) {
        openAppointment.status = "Completada";
        await openAppointment.save();
        console.log(`✅ Cita ${openAppointment._id} marcada como Completada`);
      }
    } catch (appointmentError) {
      console.error("⚠️ Error al buscar/actualizar cita:", appointmentError);
    }

    // CREAR FACTURA AUTOMÁTICA - SOLO SI ES INTERNA
    if (isInternal) {
      try {
        const invoice = new Invoice({
          ownerId: patient.owner,
          patientId: patientId,
          items: [
            {
              type: "vacuna",
              resourceId: data.productId || vaccination._id,
              description: `${finalVaccineType} - ${patient.name}`,
              cost: finalCost,
              quantity: 1,
            },
          ],
          currency: "USD",
          total: finalCost,
          amountPaid: 0,
          paymentStatus: "Pendiente",
          date: new Date(),
          veterinarianId: req.user._id,
        });
        await invoice.save();
        console.log("✅ Factura creada:", invoice._id);
      } catch (invoiceError) {
        console.error("⚠️ Error al crear factura para vacuna:", invoiceError);
      }
    }

    res.status(201).json({
      msg: "Vacuna registrada correctamente",
      vaccination,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ msg: error.message });
    }
    console.error("Error en createVaccination:", error);
    res.status(500).json({ msg: "Error al registrar la vacuna" });
  }
};

  /* ---------- OBTENER VACUNAS POR PACIENTE ---------- */
  static getVaccinationsByPatient = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { patientId } = req.params;

      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id,
      });

      if (!patient) {
        return res.status(404).json({ msg: "Paciente no encontrado o no autorizado" });
      }

      const vaccinations = await Vaccination.find({ patientId })
        .populate("productId", "name category salePrice")
        .sort({
          vaccinationDate: -1,
        });

      res.json({ vaccinations });
    } catch (error: any) {
      console.error("Error en getVaccinationsByPatient:", error);
      res.status(500).json({ msg: "Error al obtener historial de vacunas" });
    }
  };

  /* ---------- OBTENER TODAS LAS VACUNAS DEL VETERINARIO ---------- */
  static getAllVaccinations = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const vaccinations = await Vaccination.find({
        veterinarianId: req.user._id,
      })
        .populate("patientId", "name species breed")
        .populate("productId", "name category salePrice")
        .sort({ vaccinationDate: -1 });

      res.json({ vaccinations });
    } catch (error: any) {
      console.error("Error en getAllVaccinations:", error);
      res.status(500).json({ msg: "Error al obtener vacunas" });
    }
  };

  /* ---------- OBTENER VACUNA POR ID ---------- */
  static getVaccinationById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const vaccination = await Vaccination.findOne({
        _id: req.params.id,
        veterinarianId: req.user._id,
      }).populate("productId", "name category salePrice");

      if (!vaccination) {
        return res.status(404).json({ msg: "Vacuna no encontrada o no autorizada" });
      }

      res.json({ vaccination });
    } catch (error: any) {
      console.error("Error en getVaccinationById:", error);
      res.status(500).json({ msg: "Error al obtener vacuna" });
    }
  };

  /* ---------- ACTUALIZAR VACUNA ---------- */
  static updateVaccination = async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const existingVaccination = await Vaccination.findOne({
        _id: id,
        veterinarianId: req.user._id,
      });

      if (!existingVaccination) {
        return res.status(404).json({ msg: "Vacuna no encontrada o no autorizada" });
      }

      // 👇 Lógica para producto al actualizar
      let finalCost = data.cost !== undefined ? data.cost : existingVaccination.cost;
      let finalVaccineType = data.vaccineType !== undefined ? data.vaccineType : existingVaccination.vaccineType;

      if (data.productId) {
        const product = await Product.findById(data.productId);
        if (!product) {
          return res.status(404).json({ msg: "Producto no encontrado" });
        }
        finalCost = product.salePrice;
        finalVaccineType = product.name;
      }

      const updateData = {
        ...data,
        vaccineType: finalVaccineType,
        cost: finalCost,
      };

      const updatedVaccination = await Vaccination.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate("productId", "name category salePrice");

      res.json({
        msg: "Vacuna actualizada correctamente",
        vaccination: updatedVaccination,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ msg: error.message });
      }
      console.error("Error en updateVaccination:", error);
      res.status(500).json({ msg: "Error al actualizar vacuna" });
    }
  };

  /* ---------- ELIMINAR VACUNA ---------- */
  static deleteVaccination = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const vaccination = await Vaccination.findOneAndDelete({
        _id: req.params.id,
        veterinarianId: req.user._id,
      });

      if (!vaccination) {
        return res.status(404).json({ msg: "Vacuna no encontrada o no autorizada" });
      }

      res.json({ msg: "Vacuna eliminada correctamente" });
    } catch (error: any) {
      console.error("Error en deleteVaccination:", error);
      res.status(500).json({ msg: "Error al eliminar vacuna" });
    }
  };
}