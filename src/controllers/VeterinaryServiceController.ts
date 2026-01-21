// src/controllers/VeterinaryServiceController.ts
import type { Request, Response } from "express";
import VeterinaryService from "../models/VeterinaryService";
import Patient from "../models/Patient";
import Product from "../models/Product";
import Inventory from "../models/Inventory";
import InventoryMovement from "../models/InventoryMovement";
import Invoice from "../models/Invoice";

export class VeterinaryServiceController {

  // ==========================================
  // Crear Servicio (Maneja stock y facturación)
  // ==========================================
  static createService = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { 
      serviceName, 
      description, 
      products = [], 
      veterinarianFee = 0,
      discount = 0,
      serviceDate
    } = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const patient = await Patient.findOne({
        _id: patientId,
        mainVet: req.user._id,
      });

      if (!patient) {
        return res.status(404).json({ msg: "Paciente no encontrado" });
      }

      const processedProducts = [];

      for (const item of products) {
        if (item.productId) {
          const product = await Product.findOne({ _id: item.productId, veterinarian: req.user._id });
          const inventory = await Inventory.findOne({ product: item.productId, veterinarian: req.user._id });

          if (!product || !inventory) {
             return res.status(404).json({ msg: `Producto no disponible: ${item.productName}` });
          }

          const isFullUnit = item.isFullUnit !== false; 
          const quantityToUse = Number(item.quantity);

          if (isFullUnit) {
            if (inventory.stockUnits < quantityToUse) {
              return res.status(400).json({ msg: `Stock insuficiente de ${product.name}` });
            }
            inventory.stockUnits -= quantityToUse;
          } else {
            if (!product.divisible) {
              return res.status(400).json({ msg: `${product.name} no es divisible` });
            }
            
            let dosesNeeded = quantityToUse;
            
            if (inventory.stockDoses >= dosesNeeded) {
              inventory.stockDoses -= dosesNeeded;
            } else {
              dosesNeeded -= inventory.stockDoses;
              inventory.stockDoses = 0;
              
              const unitsToOpen = Math.ceil(dosesNeeded / product.dosesPerUnit);
              if (inventory.stockUnits < unitsToOpen) {
                return res.status(400).json({ msg: `Stock insuficiente de ${product.name}` });
              }
              
              inventory.stockUnits -= unitsToOpen;
              const newDoses = (unitsToOpen * product.dosesPerUnit) - dosesNeeded;
              inventory.stockDoses = newDoses;
            }
          }

          inventory.lastMovement = new Date();
          await inventory.save();

          await InventoryMovement.create({
            product: product._id,
            type: "salida",
            reason: "uso_clinico",
            quantityUnits: isFullUnit ? quantityToUse : 0,
            quantityDoses: isFullUnit ? 0 : quantityToUse,
            stockAfterUnits: inventory.stockUnits,
            stockAfterDoses: inventory.stockDoses,
            referenceType: "VeterinaryService", 
            createdBy: req.user._id,
            notes: `Servicio: ${serviceName}`
          });

          const finalUnitPrice = isFullUnit 
            ? product.salePrice 
            : (product.salePricePerDose || (product.salePrice / product.dosesPerUnit));

          processedProducts.push({
            productId: product._id,
            productName: product.name,
            quantity: quantityToUse,
            unitPrice: finalUnitPrice,
            subtotal: quantityToUse * finalUnitPrice
          });

        } else {
          processedProducts.push({
            productName: item.productName,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.quantity) * Number(item.unitPrice)
          });
        }
      }

      const service = new VeterinaryService({
        patientId,
        veterinarianId: req.user._id,
        serviceName,
        description,
        serviceDate: serviceDate || new Date(),
        products: processedProducts,
        veterinarianFee: Number(veterinarianFee),
        discount: Number(discount),
        status: "Completado"
      });

      await service.save();

      try {
        const invoiceItems = [];

        service.products.forEach(prod => {
          if (prod.subtotal > 0) {
            invoiceItems.push({
              type: "producto",
              resourceId: prod.productId || service._id,
              description: prod.productName,
              cost: prod.subtotal,
              quantity: 1
            });
          }
        });

        if (service.veterinarianFee > 0) {
          invoiceItems.push({
            type: "consulta",
            resourceId: service._id,
            description: `Honorarios - ${serviceName}`,
            cost: service.veterinarianFee,
            quantity: 1
          });
        }

        const invoiceTotal = service.totalCost;
        const paymentStatus = invoiceTotal === 0 ? "Pagado" : "Pendiente";

        if (invoiceItems.length > 0) {
          await Invoice.create({
            ownerId: patient.owner,
            patientId: patientId,
            veterinarianId: req.user._id,
            items: invoiceItems,
            currency: "USD",
            total: invoiceTotal,
            amountPaid: 0,
            paymentStatus: paymentStatus,
            date: new Date(),
          });
        }

      } catch (error) {
        console.error("Error generando factura:", error);
      }

      res.status(201).json({
        msg: "Servicio registrado correctamente",
        service
      });

    } catch (error: any) {
      console.error(error);
      res.status(500).json({ msg: "Error al registrar el servicio" });
    }
  };

  // ==========================================
  // Obtener servicio por ID
  // ==========================================
  static getServiceById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { id } = req.params;

      const service = await VeterinaryService.findById(id);

      if (!service) {
        return res.status(404).json({ msg: "Servicio no encontrado" });
      }

      if (service.veterinarianId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: "No tienes permiso para ver este servicio" });
      }

      res.json({ service });
    } catch (error: any) {
      console.error("Error en getServiceById:", error);
      res.status(500).json({ msg: "Error al obtener el servicio" });
    }
  };

  // ==========================================
  // Obtener servicios por paciente
  // ==========================================
  static getServicesByPatient = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;
      
      const patient = await Patient.findOne({ _id: patientId, mainVet: req.user._id });
      if (!patient) return res.status(404).json({ msg: "Paciente no encontrado" });

      const services = await VeterinaryService.find({ patientId })
        .sort({ serviceDate: -1 });

      res.json({ services });
    } catch (error) {
      res.status(500).json({ msg: "Error obteniendo servicios" });
    }
  };

  // ==========================================
  // Eliminar servicio
  // ==========================================
  static deleteService = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const service = await VeterinaryService.findById(id);

      if (!service) return res.status(404).json({ msg: "Servicio no encontrado" });
      
      if (service.veterinarianId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: "No autorizado" });
      }
      
      await service.deleteOne();
      res.json({ msg: "Servicio eliminado correctamente" });

    } catch (error) {
      res.status(500).json({ msg: "Error eliminando servicio" });
    }
  };
}