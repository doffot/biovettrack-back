// src/controllers/InvoiceController.ts
import type { Request, Response } from "express";
import mongoose from "mongoose";
import Invoice from "../models/Invoice";

export class InvoiceController {
  /* ---------- CREAR FACTURA ---------- */
  static createInvoice = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const invoiceData = req.body;

      // Validar que tenga al menos un ítem
      if (!invoiceData.items || invoiceData.items.length === 0) {
        return res.status(400).json({ msg: "La factura debe tener al menos un ítem" });
      }

      // Validar que tenga dueño (registrado o no)
      if (!invoiceData.ownerId && (!invoiceData.ownerName || !invoiceData.ownerPhone)) {
        return res.status(400).json({ 
          msg: "La factura debe tener un dueño (registrado o con nombre y teléfono)" 
        });
      }

      const invoice = new Invoice({
        ...invoiceData,
        veterinarianId: req.user._id,
      });

      await invoice.save();

      res.status(201).json({
        msg: "Factura creada correctamente",
        invoice,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ msg: "Datos inválidos", errors: error.errors });
      }
      console.error("Error en createInvoice:", error);
      return res.status(500).json({ msg: "Error al crear la factura" });
    }
  };

  /* ---------- LISTAR FACTURAS DEL VETERINARIO ---------- */
  static getInvoices = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { 
        status, 
        ownerId, 
        ownerName,
        patientId,
        page = 1,
        limit = 10 
      } = req.query;

      const filter: any = { veterinarianId: req.user._id };

      // Filtros opcionales
      if (status) filter.paymentStatus = status;
      if (ownerId) filter.ownerId = ownerId;
      if (ownerName) filter.ownerName = { $regex: ownerName, $options: "i" };
      if (patientId) filter.patientId = patientId;

      const invoices = await Invoice.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate("ownerId", "name contact")
        .populate("patientId", "name")
        .populate("veterinarianId", "name lastName")
        .populate("paymentMethod", "name");

      const total = await Invoice.countDocuments(filter);

      res.json({
        invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error("Error en getInvoices:", error);
      return res.status(500).json({ msg: "Error al obtener facturas" });
    }
  };

  /* ---------- OBTENER FACTURA POR ID ---------- */
  static getInvoiceById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID de factura inválido" });
      }

      const invoice = await Invoice.findOne({
        _id: id,
        veterinarianId: req.user._id,
      })
        .populate("ownerId", "name contact")
        .populate("patientId", "name")
        .populate("veterinarianId", "name lastName")
        .populate("paymentMethod", "name");

      if (!invoice) {
        return res.status(404).json({ msg: "Factura no encontrada" });
      }

      res.json({ invoice });
    } catch (error: any) {
      console.error("Error en getInvoiceById:", error);
      return res.status(500).json({ msg: "Error al obtener la factura" });
    }
  };

  /* ---------- ACTUALIZAR FACTURA (PAGO) ---------- */
  static updateInvoice = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID de factura inválido" });
      }

      const currentInvoice = await Invoice.findById(id);
      
      if (!currentInvoice) {
        return res.status(404).json({ msg: "Factura no encontrada" });
      }

      // 👇 NUEVO: Manejar pagos por moneda
      if (updateData.amountPaidUSD !== undefined || updateData.amountPaidBs !== undefined) {
        // Si viene amountPaidUSD, actualizarlo
        if (updateData.amountPaidUSD !== undefined) {
          currentInvoice.amountPaidUSD = updateData.amountPaidUSD;
        }
        
        // Si viene amountPaidBs, actualizarlo
        if (updateData.amountPaidBs !== undefined) {
          currentInvoice.amountPaidBs = updateData.amountPaidBs;
        }

        // Si viene exchangeRate, actualizarlo
        if (updateData.exchangeRate !== undefined) {
          currentInvoice.exchangeRate = updateData.exchangeRate;
        }

        // Guardar con el middleware que calculará amountPaid y paymentStatus
        await currentInvoice.save();

        const populatedInvoice = await Invoice.findById(id)
          .populate("ownerId", "name contact")
          .populate("patientId", "name")
          .populate("veterinarianId", "name lastName")
          .populate("paymentMethod", "name");

        return res.json({
          msg: "Factura actualizada correctamente",
          invoice: populatedInvoice,
        });
      }

      // 👇 LEGACY: Si viene amountPaid directamente (compatibilidad)
      if (updateData.amountPaid !== undefined) {
        // Validar que no exceda el total
        if (updateData.amountPaid > currentInvoice.total) {
          return res.status(400).json({ msg: "El monto pagado no puede exceder el total" });
        }
        
        // Si la factura es en Bs, guardar en amountPaidBs
        if (currentInvoice.currency === "Bs") {
          updateData.amountPaidBs = updateData.amountPaid;
          updateData.amountPaidUSD = 0;
        } else {
          // Si es en USD, guardar en amountPaidUSD
          updateData.amountPaidUSD = updateData.amountPaid;
          updateData.amountPaidBs = 0;
        }
      }

      // Actualizar otros campos
      const invoice = await Invoice.findOneAndUpdate(
        {
          _id: id,
          veterinarianId: req.user._id,
        },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("ownerId", "name contact")
        .populate("patientId", "name")
        .populate("veterinarianId", "name lastName")
        .populate("paymentMethod", "name");

      if (!invoice) {
        return res.status(404).json({ msg: "Factura no encontrada" });
      }

      res.json({
        msg: "Factura actualizada correctamente",
        invoice,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        console.error("Error de validación:", error.errors);
        return res.status(400).json({ msg: "Datos inválidos", errors: error.errors });
      }
      console.error("Error en updateInvoice:", error);
      return res.status(500).json({ msg: "Error al actualizar la factura" });
    }
  };

  /* ---------- ELIMINAR FACTURA ---------- */
  static deleteInvoice = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID de factura inválido" });
      }

      const invoice = await Invoice.findOneAndDelete({
        _id: id,
        veterinarianId: req.user._id,
      });

      if (!invoice) {
        return res.status(404).json({ msg: "Factura no encontrada" });
      }

      res.json({ msg: "Factura eliminada correctamente" });
    } catch (error: any) {
      console.error("Error en deleteInvoice:", error);
      return res.status(500).json({ msg: "Error al eliminar la factura" });
    }
  };

   /* ---------- ACTUALIZAR ITEM DE FACTURA ---------- */
  static updateInvoiceItem = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { id, resourceId } = req.params;
      const { cost, description, quantity } = req.body;

      // Validar IDs
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID de factura inválido" });
      }

      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({ msg: "ID de recurso inválido" });
      }

      // Buscar la factura
      const invoice = await Invoice.findOne({
        _id: id,
        veterinarianId: req.user._id,
      });

      if (!invoice) {
        return res.status(404).json({ msg: "Factura no encontrada" });
      }

      // Buscar el item por resourceId
      const itemIndex = invoice.items.findIndex(
        (item) => item.resourceId.toString() === resourceId
      );

      if (itemIndex === -1) {
        return res.status(404).json({ msg: "Item no encontrado en la factura" });
      }

      // Actualizar el item
      if (cost !== undefined) {
        invoice.items[itemIndex].cost = cost;
      }
      if (description !== undefined) {
        invoice.items[itemIndex].description = description;
      }
      if (quantity !== undefined) {
        invoice.items[itemIndex].quantity = quantity;
      }

      // Recalcular el total
      invoice.total = invoice.items.reduce(
        (sum, item) => sum + item.cost * item.quantity,
        0
      );

      // Guardar (el middleware pre-save actualizará amountPaid y paymentStatus)
      await invoice.save();

      // Populate para la respuesta
      const populatedInvoice = await Invoice.findById(id)
        .populate("ownerId", "name contact")
        .populate("patientId", "name")
        .populate("veterinarianId", "name lastName")
        .populate("paymentMethod", "name");

      res.json({
        msg: "Item actualizado correctamente",
        invoice: populatedInvoice,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        console.error("Error de validación:", error.errors);
        return res.status(400).json({ msg: "Datos inválidos", errors: error.errors });
      }
      console.error("Error en updateInvoiceItem:", error);
      return res.status(500).json({ msg: "Error al actualizar el item" });
    }
  };

  /* ---------- BUSCAR FACTURA POR RESOURCE ID ---------- */
  static getInvoiceByResourceId = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { resourceId } = req.params;
      const { type = "grooming" } = req.query;

      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({ msg: "ID de recurso inválido" });
      }

      // Buscar factura que contenga este recurso
      const invoice = await Invoice.findOne({
        veterinarianId: req.user._id,
        "items.resourceId": resourceId,
        "items.type": type,
      })
        .populate("ownerId", "name contact")
        .populate("patientId", "name")
        .populate("veterinarianId", "name lastName")
        .populate("paymentMethod", "name");

      if (!invoice) {
        return res.status(404).json({ msg: "Factura no encontrada para este recurso" });
      }

      res.json({ invoice });
    } catch (error: any) {
      console.error("Error en getInvoiceByResourceId:", error);
      return res.status(500).json({ msg: "Error al buscar la factura" });
    }
  };

}