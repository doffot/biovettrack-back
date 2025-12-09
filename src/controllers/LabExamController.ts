// src/controllers/LabExamController.ts
import type { Request, Response } from "express";
import LabExam from "../models/LabExam";
import Invoice from "../models/Invoice"; 
import Patient from "../models/Patient"; 
import { validateDifferentialSum } from "../utils/validateDifferentialCount";

export class LabExamController {
  /* ---------- CREAR ---------- */

static createLabExam = async (req: Request, res: Response) => {
  const data = req.body;

  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: 'Usuario no autenticado' });
    }

    // Validar conteo diferencial
    if (data.differentialCount && !validateDifferentialSum(data.differentialCount)) {
      return res.status(400).json({
        msg: "La suma del conteo diferencial no puede superar 100",
      });
    }

    // Crear examen
    const labExam = new LabExam({
      ...data,
      vetId: req.user._id,
    });
    await labExam.save();

    //  CREAR FACTURA AUTOMÁTICAMENTE
    try {
      const isReferredPatient = !labExam.patientId;
      
      let invoiceData: any;
      
      if (isReferredPatient) {
        const exchangeRate = data.exchangeRate;
        
        // Validar que venga la tasa
        if (!exchangeRate || exchangeRate <= 0) {
          console.error("⚠️ No se recibió tasa de cambio válida");
          throw new Error("Tasa de cambio no proporcionada");
        }
        
        const amountInBs = data.amount || parseFloat((labExam.cost * exchangeRate).toFixed(2));
        
        invoiceData = {
          items: [{
            type: "labExam",
            resourceId: labExam._id,
            description: `Hemograma - ${labExam.patientName}`,
            cost: labExam.cost,
            quantity: 1,
          }],
          currency: "Bs",
          exchangeRate: exchangeRate,
          total: amountInBs,
          amountPaid: amountInBs,
          paymentStatus: "Pagado",
          date: new Date(),
          veterinarianId: req.user._id,
          ownerName: labExam.ownerName,
          ownerPhone: labExam.ownerPhone,
          
          paymentMethod: data.paymentMethodId || data.paymentMethod,
          paymentReference: data.paymentReference || data.reference,
        };
      } else {
        invoiceData = {
          items: [{
            type: "labExam",
            resourceId: labExam._id,
            description: `Hemograma - ${labExam.patientName}`,
            cost: labExam.cost,
            quantity: 1,
          }],
          currency: "USD",
          total: labExam.cost,
          amountPaid: 0,
          paymentStatus: "Pendiente",
          date: new Date(),
          veterinarianId: req.user._id,
        };
        
        const patient = await Patient.findById(labExam.patientId);
        if (patient) {
          invoiceData.ownerId = patient.owner;
          invoiceData.patientId = labExam.patientId;
        }
      }

      const invoice = new Invoice(invoiceData);
      await invoice.save();
      
      console.log("✅ Factura creada:", {
        id: invoice._id,
        exchangeRate: invoice.exchangeRate,
        total: invoice.total
      });
      
    } catch (invoiceError) {
      console.error("⚠️ Error al crear factura (examen guardado):", invoiceError);
    }

    res.status(201).json(labExam);
  } catch (error: any) {
    console.error("Error en createLabExam:", error);
    res.status(500).json("Error al crear el examen");
  }
};

  /* ---------- LISTAR SOLO LOS EXÁMENES DEL VETERINARIO ACTUAL ---------- */
  static getAllLabExams = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const exams = await LabExam.find({
        vetId: req.user._id
      }).sort({ createdAt: -1 });

      res.json(exams);
    } catch (error: any) {
      console.error("Error en getAllLabExams:", error);
      res.status(500).json({ msg: "Error al obtener exámenes" });
    }
  };

  /* ---------- OBTENER UNO (solo si pertenece al veterinario) ---------- */
  static getLabExamById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const { id } = req.params;

      const exam = await LabExam.findOne({
        _id: id,
        vetId: req.user._id
      });

      if (!exam) {
        return res.status(404).json({ msg: "Examen no encontrado o no autorizado" });
      }

      res.json(exam);
    } catch (error: any) {
      console.error("Error en getLabExamById:", error);
      res.status(500).json({ msg: "Error al obtener examen" });
    }
  };

  /* ---------- ACTUALIZAR ---------- */
  static updateLabExam = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const { id } = req.params;
      const data = req.body;

      if (data.differentialCount && !validateDifferentialSum(data.differentialCount)) {
        return res.status(400).json({
          msg: "La suma del conteo diferencial no puede superar 100",
        });
      }

      const exam = await LabExam.findOne({
        _id: id,
        vetId: req.user._id
      });

      if (!exam) {
        return res.status(404).json({ msg: "Examen no encontrado o no autorizado" });
      }

      const updated = await LabExam.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });

      res.json({
        msg: "Examen actualizado correctamente",
        labExam: updated,
      });
    } catch (error: any) {
      console.error("Error en updateLabExam:", error);
      res.status(500).json({ msg: "Error al actualizar examen" });
    }
  };

  /* ---------- ELIMINAR  ---------- */
  static deleteLabExam = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const { id } = req.params;

      const exam = await LabExam.findOneAndDelete({
        _id: id,
        vetId: req.user._id
      });

      if (!exam) {
        return res.status(404).json({ msg: "Examen no encontrado o no autorizado" });
      }

      res.json({ msg: "Examen eliminado correctamente" });
    } catch (error: any) {
      console.error("Error en deleteLabExam:", error);
      res.status(500).json({ msg: "Error al eliminar examen" });
    }
  };

/* ---------- OBTENER EXÁMENES POR PACIENTE ---------- */
static getLabExamsByPatient = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: 'Usuario no autenticado' });
    }

    const { patientId } = req.params;

    const exams = await LabExam.find({
      patientId,
      vetId: req.user._id
    }).sort({ date: -1 });

    res.json(exams);
  } catch (error: any) {
    console.error("Error en getLabExamsByPatient:", error);
    res.status(500).json({ msg: "Error al obtener exámenes del paciente" });
  }
};


}