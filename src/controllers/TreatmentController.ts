// src/controllers/TreatmentController.ts
import type { Request, Response } from "express";
import Treatment from "../models/Treatment";
import Patient from "../models/Patient";
import Invoice from "../models/Invoice";
import Product from "../models/Product";
import Inventory from "../models/Inventory";
import InventoryMovement from "../models/InventoryMovement";

export class TreatmentController {
  // Crear
  static createTreatment = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const treatmentData = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

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

      let finalCost = treatmentData.cost;
      let finalProductName = treatmentData.productName;

      // Procesar producto si existe
      if (treatmentData.productId) {
        const product = await Product.findOne({
          _id: treatmentData.productId,
          veterinarian: req.user._id
        });
        if (!product) {
          return res.status(404).json({ msg: "Producto no encontrado o no autorizado" });
        }

        if (finalCost <= 0) {
          return res.status(400).json({ msg: "El costo debe ser mayor a 0" });
        }

        const inventory = await Inventory.findOne({
          product: treatmentData.productId,
          veterinarian: req.user._id
        });

        if (!inventory) {
          return res.status(400).json({ msg: "El producto no tiene stock registrado" });
        }

        const isFullUnit = treatmentData.isFullUnit || false;
        const quantity = treatmentData.quantity || 1;

        if (isFullUnit) {
          if (inventory.stockUnits < quantity) {
            return res.status(400).json({ 
              msg: `Stock insuficiente. Solo hay ${inventory.stockUnits} ${product.unit}(s) disponibles` 
            });
          }
        } else {
          if (!product.divisible) {
            return res.status(400).json({ 
              msg: "Este producto no es divisible. Solo se puede usar por unidad completa" 
            });
          }

          const totalDoses = (inventory.stockUnits * product.dosesPerUnit) + inventory.stockDoses;
          if (totalDoses < quantity) {
            return res.status(400).json({ 
              msg: `Stock insuficiente. Solo hay ${totalDoses} ${product.doseUnit} disponibles` 
            });
          }
        }

        finalProductName = product.name;
      }

      const treatment = new Treatment({
        ...treatmentData,
        patientId,
        veterinarianId: req.user._id,
        productName: finalProductName,
        cost: finalCost,
        status: treatmentData.status || "Activo",
      });

      await treatment.save();

      // Consumir stock
      if (treatmentData.productId) {
        const product = await Product.findById(treatmentData.productId);
        const inventory = await Inventory.findOne({
          product: treatmentData.productId,
          veterinarian: req.user._id
        });

        if (inventory && product) {
          const isFullUnit = treatmentData.isFullUnit || false;
          const quantity = treatmentData.quantity || 1;

          let newStockUnits = inventory.stockUnits;
          let newStockDoses = inventory.stockDoses;

          if (isFullUnit) {
            newStockUnits -= quantity;
          } else {
            let dosesToConsume = quantity;

            if (newStockDoses >= dosesToConsume) {
              newStockDoses -= dosesToConsume;
              dosesToConsume = 0;
            } else {
              dosesToConsume -= newStockDoses;
              newStockDoses = 0;
            }

            if (dosesToConsume > 0) {
              const unitsNeeded = Math.ceil(dosesToConsume / product.dosesPerUnit);
              
              if (newStockUnits < unitsNeeded) {
                return res.status(400).json({ 
                  msg: `Stock insuficiente. Necesitas ${unitsNeeded} ${product.unit}(s) pero solo tienes ${newStockUnits}` 
                });
              }

              newStockUnits -= unitsNeeded;
              const totalDosesFromOpened = unitsNeeded * product.dosesPerUnit;
              newStockDoses = totalDosesFromOpened - dosesToConsume;
            }
          }

          inventory.stockUnits = newStockUnits;
          inventory.stockDoses = newStockDoses;
          inventory.lastMovement = new Date();
          await inventory.save();

          const movement = new InventoryMovement({
            product: treatmentData.productId,
            type: "salida",
            reason: "uso_clinico",
            quantityUnits: isFullUnit ? quantity : 0,
            quantityDoses: isFullUnit ? 0 : quantity,
            stockAfterUnits: newStockUnits,
            stockAfterDoses: newStockDoses,
            referenceType: "Treatment",
            referenceId: treatment._id,
            createdBy: req.user._id,
          });
          await movement.save();
        }
      }

      // Crear factura
      try {
        const invoice = new Invoice({
          ownerId: patient.owner,
          patientId: patientId,
          items: [{
            type: "producto",
            resourceId: treatmentData.productId || treatment._id,
            description: `Tratamiento ${treatment.treatmentType} - ${finalProductName}`,
            cost: finalCost,
            quantity: 1,
          }],
          currency: "USD",
          total: finalCost,
          amountPaid: 0,
          paymentStatus: "Pendiente",
          date: new Date(),
          veterinarianId: req.user._id,
        });
        await invoice.save();
      } catch (invoiceError) {
        console.error("Error al crear factura:", invoiceError);
      }

      res.status(201).json({
        msg: 'Tratamiento registrado correctamente',
        treatment,
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: error.message });
      }
      console.error('Error en createTreatment:', error);
      res.status(500).json({ msg: 'Error al registrar el tratamiento' });
    }
  };

  // Obtener todos
  static getAllTreatments = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const patients = await Patient.find({ mainVet: req.user._id }).select('_id');
      const patientIds = patients.map(p => p._id);

      const treatments = await Treatment.find({ 
        patientId: { $in: patientIds } 
      })
        .populate('patientId', 'name species breed')
        .sort({ startDate: -1 });

      res.json({ treatments });
    } catch (error: any) {
      console.error('Error en getAllTreatments:', error);
      res.status(500).json({ msg: 'Error al obtener tratamientos' });
    }
  };

  // Obtener por paciente
  static getTreatmentsByPatient = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const { patientId } = req.params;

      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(404).json({ msg: 'Paciente no encontrado o no autorizado' });
      }

      const treatments = await Treatment.find({ patientId })
        .sort({ startDate: -1 });

      res.json({ treatments });
    } catch (error: any) {
      console.error('Error en getTreatmentsByPatient:', error);
      res.status(500).json({ msg: 'Error al obtener historial de tratamientos' });
    }
  };

  // Obtener por ID
  static getTreatmentById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const treatment = await Treatment.findById(req.params.id);
      if (!treatment) {
        return res.status(404).json({ msg: "Tratamiento no encontrado" });
      }

      const patient = await Patient.findOne({
        _id: treatment.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para ver este tratamiento" });
      }
      
      res.json({ treatment });
    } catch (error: any) {
      console.error('Error en getTreatmentById:', error);
      res.status(500).json({ msg: 'Error al obtener tratamiento' });
    }
  };

  // Actualizar
  static updateTreatment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const treatmentData = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const treatment = await Treatment.findById(id);
      if (!treatment) {
        return res.status(404).json({ msg: "Tratamiento no encontrado" });
      }

      const patient = await Patient.findOne({
        _id: treatment.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para actualizar este tratamiento" });
      }

      let finalCost = treatmentData.cost !== undefined ? treatmentData.cost : treatment.cost;
      let finalProductName = treatmentData.productName !== undefined ? treatmentData.productName : treatment.productName;

      if (treatmentData.productId) {
        const product = await Product.findById(treatmentData.productId);
        if (!product) {
          return res.status(404).json({ msg: "Producto no encontrado" });
        }
        finalCost = product.salePrice;
        finalProductName = product.name;
      }

      const updateData = {
        ...treatmentData,
        productName: finalProductName,
        cost: finalCost,
      };

      const updatedTreatment = await Treatment.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      res.json({ 
        msg: "Tratamiento actualizado correctamente", 
        treatment: updatedTreatment
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: error.message });
      }
      console.error("Error en updateTreatment:", error);
      res.status(500).json({ msg: "Error al actualizar tratamiento" });
    }
  };

  // Eliminar
  static deleteTreatment = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const treatment = await Treatment.findById(req.params.id);
      if (!treatment) {
        return res.status(404).json({ msg: "Tratamiento no encontrado" });
      }

      const patient = await Patient.findOne({
        _id: treatment.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para eliminar este tratamiento" });
      }

      await Treatment.findByIdAndDelete(req.params.id);
      
      res.json({ msg: "Tratamiento eliminado correctamente" });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ msg: error.message || "Error al eliminar tratamiento" });
    }
  };
}