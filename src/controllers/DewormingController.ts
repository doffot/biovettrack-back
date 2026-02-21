// src/controllers/DewormingController.ts
import type { Request, Response } from "express";
import Deworming from "../models/Deworming";
import Patient from "../models/Patient";
import Invoice from "../models/Invoice";
import Product from "../models/Product";
import Inventory from "../models/Inventory";
import InventoryMovement from "../models/InventoryMovement";

export class DewormingController {
  /* ---------- CREAR DESPARASITACIÓN ---------- */
 static createDeworming = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const dewormingData = req.body;

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

        // Lógica de flags según el origen
        const isInternal = dewormingData.source === "Interno";
        let finalCost = isInternal ? dewormingData.cost : 0; // Si es externo, costo es 0
        let finalProductName = dewormingData.productName;

        /* ---------- 1. VALIDACIÓN DE STOCK (SOLO SI ES INTERNO) ---------- */
        if (isInternal && dewormingData.productId) {
            const product = await Product.findOne({
                _id: dewormingData.productId,
                veterinarian: req.user._id
            });

            if (!product) {
                return res.status(404).json({ msg: "Producto no encontrado o no autorizado" });
            }

            if (finalCost < 0) { // Permitimos 0 si es una promoción, pero no negativo
                return res.status(400).json({ msg: "El costo no puede ser negativo" });
            }

            const inventory = await Inventory.findOne({
                product: dewormingData.productId,
                veterinarian: req.user._id
            });

            if (!inventory) {
                return res.status(400).json({ msg: "El producto no tiene stock registrado" });
            }

            const isFullUnit = dewormingData.isFullUnit || false;
            const quantity = dewormingData.quantity || 1;

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

        /* ---------- 2. GUARDAR EL REGISTRO MÉDICO ---------- */
        const deworming = new Deworming({
            ...dewormingData,
            patientId,
            veterinarianId: req.user._id,
            productName: finalProductName,
            cost: finalCost,
        });

        await deworming.save();

        /* ---------- 3. CONSUMIR STOCK (SOLO SI ES INTERNO) ---------- */
        if (isInternal && dewormingData.productId) {
            const product = await Product.findById(dewormingData.productId);
            const inventory = await Inventory.findOne({
                product: dewormingData.productId,
                veterinarian: req.user._id
            });

            if (inventory && product) {
                const isFullUnit = dewormingData.isFullUnit || false;
                const quantity = dewormingData.quantity || 1;
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
                    product: dewormingData.productId,
                    type: "salida",
                    reason: "uso_clinico",
                    quantityUnits: isFullUnit ? quantity : 0,
                    quantityDoses: isFullUnit ? 0 : quantity,
                    stockAfterUnits: newStockUnits,
                    stockAfterDoses: newStockDoses,
                    referenceType: "Deworming",
                    referenceId: deworming._id,
                    createdBy: req.user._id,
                });
                await movement.save();
            }
        }

        /* ---------- 4. CREAR FACTURA (SOLO SI ES INTERNO) ---------- */
        if (isInternal) {
            try {
                const invoice = new Invoice({
                    ownerId: patient.owner,
                    patientId: patientId,
                    items: [{
                        type: "producto",
                        resourceId: dewormingData.productId || deworming._id,
                        description: `Desparasitación ${deworming.dewormingType} - ${finalProductName}`,
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
                console.error("Error al crear factura para desparasitación:", invoiceError);
            }
        }

        res.status(201).json({
            msg: isInternal 
                ? 'Desparasitación registrada y facturada correctamente' 
                : 'Desparasitación externa registrada en el historial',
            deworming,
        });

    } catch (error: any) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: error.message });
        }
        console.error('Error en createDeworming:', error);
        res.status(500).json({ msg: 'Error al registrar la desparasitación' });
    }
};

  /* ---------- OBTENER TODAS LAS DESPARASITACIONES DEL VETERINARIO ---------- */
  static getAllDewormings = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const patients = await Patient.find({ mainVet: req.user._id }).select('_id');
      const patientIds = patients.map(p => p._id);

      const dewormings = await Deworming.find({ 
        patientId: { $in: patientIds } 
      })
        .populate('patientId', 'name species breed')
        .sort({ applicationDate: -1 });

      res.json({ dewormings });
    } catch (error: any) {
      console.error('Error en getAllDewormings:', error);
      res.status(500).json({ msg: 'Error al obtener desparasitaciones' });
    }
  };

  /* ---------- OBTENER POR PACIENTE ---------- */
  static getDewormingsByPatient = async (req: Request, res: Response) => {
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

      const dewormings = await Deworming.find({ patientId })
        .sort({ applicationDate: -1 });

      res.json({ dewormings });
    } catch (error: any) {
      console.error('Error en getDewormingsByPatient:', error);
      res.status(500).json({ msg: 'Error al obtener historial de desparasitación' });
    }
  };

  /* ---------- OBTENER POR ID ---------- */
  static getDewormingById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const deworming = await Deworming.findById(req.params.id);
      if (!deworming) {
        return res.status(404).json({ msg: "Desparasitación no encontrada" });
      }

      const patient = await Patient.findOne({
        _id: deworming.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para ver esta desparasitación" });
      }
      
      res.json({ deworming });
    } catch (error: any) {
      console.error('Error en getDewormingById:', error);
      res.status(500).json({ msg: 'Error al obtener desparasitación' });
    }
  };

  /* ---------- ACTUALIZAR ---------- */
  static updateDeworming = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dewormingData = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const deworming = await Deworming.findById(id);
      if (!deworming) {
        return res.status(404).json({ msg: "Desparasitación no encontrada" });
      }

      const patient = await Patient.findOne({
        _id: deworming.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para actualizar esta desparasitación" });
      }

      let finalCost = dewormingData.cost !== undefined ? dewormingData.cost : deworming.cost;
      let finalProductName = dewormingData.productName !== undefined ? dewormingData.productName : deworming.productName;

      if (dewormingData.productId) {
        const product = await Product.findById(dewormingData.productId);
        if (!product) {
          return res.status(404).json({ msg: "Producto no encontrado" });
        }
        finalCost = product.salePrice;
        finalProductName = product.name;
      }

      const updateData = {
        ...dewormingData,
        productName: finalProductName,
        cost: finalCost,
      };

      const updatedDeworming = await Deworming.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      res.json({ 
        msg: "Desparasitación actualizada correctamente", 
        deworming: updatedDeworming
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: error.message });
      }
      console.error("Error en updateDeworming:", error);
      res.status(500).json({ msg: "Error al actualizar desparasitación" });
    }
  };

  /* ---------- ELIMINAR ---------- */
  static deleteDeworming = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const deworming = await Deworming.findById(req.params.id);
      if (!deworming) {
        return res.status(404).json({ msg: "Desparasitación no encontrada" });
      }

      const patient = await Patient.findOne({
        _id: deworming.patientId,
        mainVet: req.user._id
      });

      if (!patient) {
        return res.status(403).json({ msg: "No tienes permiso para eliminar esta desparasitación" });
      }

      await Deworming.findByIdAndDelete(req.params.id);
      
      res.json({ msg: "Desparasitación eliminada correctamente" });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ msg: error.message || "Error al eliminar desparasitación" });
    }
  };
}