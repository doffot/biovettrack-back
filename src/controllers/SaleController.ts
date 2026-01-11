// src/controllers/SaleController.ts
import type { Request, Response } from "express";
import mongoose from "mongoose";
import Sale from "../models/Sale";
import Product from "../models/Product";
import Inventory from "../models/Inventory";
import InventoryMovement from "../models/InventoryMovement";
import Invoice from "../models/Invoice";
import Payment from "../models/Payment";
import Owner from "../models/Owner";
import Patient from "../models/Patient";

export class SaleController {
  
  // ==================== CREAR VENTA ====================
  static createSale = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const {
        ownerId,
        ownerName,
        ownerPhone,
        patientId,
        items,
        discountTotal = 0,
        amountPaidUSD = 0,
        amountPaidBs = 0,
        creditUsed = 0,
        exchangeRate = 1,
        paymentMethodId,
        paymentReference,
        notes,
      } = req.body;

      // Validar items
      if (!items || !Array.isArray(items) || items.length === 0) {
        await session.abortTransaction();
        return res.status(400).json({ msg: "Debe incluir al menos un producto" });
      }

      // Variables para procesar
      let subtotal = 0;
      const processedItems: any[] = [];
      const inventoryUpdates: any[] = [];

      // Procesar cada item
      for (const item of items) {
        const { productId, quantity, isFullUnit = true, discount = 0 } = item;

        if (!productId || !quantity || quantity <= 0) {
          await session.abortTransaction();
          return res.status(400).json({ msg: "Datos de producto inválidos" });
        }

        // Obtener producto
        const product = await Product.findOne({
          _id: productId,
          veterinarian: req.user._id,
          active: true,
        }).session(session);

        if (!product) {
          await session.abortTransaction();
          return res.status(404).json({ msg: `Producto no encontrado: ${productId}` });
        }

        // Validar divisibilidad
        if (!isFullUnit && !product.divisible) {
          await session.abortTransaction();
          return res.status(400).json({ 
            msg: `El producto "${product.name}" no es divisible` 
          });
        }

        // Obtener inventario
        const inventory = await Inventory.findOne({
          product: productId,
          veterinarian: req.user._id,
        }).session(session);

        if (!inventory) {
          await session.abortTransaction();
          return res.status(400).json({ 
            msg: `No hay inventario para "${product.name}"` 
          });
        }

        // Validar stock
        if (isFullUnit) {
          if (inventory.stockUnits < quantity) {
            await session.abortTransaction();
            return res.status(400).json({ 
              msg: `Stock insuficiente de "${product.name}". Disponible: ${inventory.stockUnits} ${product.unit}(s)` 
            });
          }
        } else {
          const totalDoses = (inventory.stockUnits * product.dosesPerUnit) + inventory.stockDoses;
          if (totalDoses < quantity) {
            await session.abortTransaction();
            return res.status(400).json({ 
              msg: `Stock insuficiente de "${product.name}". Disponible: ${totalDoses} ${product.doseUnit}` 
            });
          }
        }

        // Calcular precios
        const unitPrice = product.salePrice;
        const pricePerDose = product.salePricePerDose || product.salePrice;
        const itemSubtotal = isFullUnit 
          ? quantity * unitPrice 
          : quantity * pricePerDose;
        const itemTotal = itemSubtotal - discount;

        subtotal += itemSubtotal;

        // Agregar item procesado
        processedItems.push({
          product: productId,
          productName: product.name,
          quantity,
          isFullUnit,
          unitPrice,
          pricePerDose,
          subtotal: itemSubtotal,
          discount,
          total: itemTotal,
          unit: product.unit,
          doseUnit: product.doseUnit,
        });

        // Preparar actualización de inventario
        inventoryUpdates.push({
          inventory,
          product,
          quantity,
          isFullUnit,
        });
      }

      // Calcular total
      const total = subtotal - discountTotal;

      // Validar crédito si se usa
      let owner = null;
      let ownerData = { name: ownerName, phone: ownerPhone };
      
      if (ownerId) {
        owner = await Owner.findById(ownerId).session(session);
        if (!owner) {
          await session.abortTransaction();
          return res.status(404).json({ msg: "Cliente no encontrado" });
        }
        ownerData = { name: owner.name, phone: owner.contact };

        if (creditUsed > 0) {
          if (owner.creditBalance < creditUsed) {
            await session.abortTransaction();
            return res.status(400).json({ 
              msg: `Crédito insuficiente. Disponible: $${owner.creditBalance.toFixed(2)}` 
            });
          }
        }
      } else if (creditUsed > 0) {
        await session.abortTransaction();
        return res.status(400).json({ 
          msg: "Se requiere un cliente registrado para usar crédito" 
        });
      }

      // Validar paciente si se proporciona
      let patientData = null;
      if (patientId) {
        const patient = await Patient.findById(patientId).session(session);
        if (patient) {
          patientData = { id: patient._id, name: patient.name };
        }
      }

      // Crear la venta
      const sale = new Sale({
        owner: ownerId || undefined,
        ownerName: ownerData.name,
        ownerPhone: ownerData.phone,
        patient: patientData?.id,
        patientName: patientData?.name,
        items: processedItems,
        subtotal,
        discountTotal,
        total,
        amountPaidUSD,
        amountPaidBs,
        creditUsed,
        exchangeRate,
        notes,
        veterinarian: req.user._id,
      });

      await sale.save({ session });

      // Actualizar inventario y crear movimientos
      for (const update of inventoryUpdates) {
        const { inventory, product, quantity, isFullUnit } = update;
        
        let newStockUnits = inventory.stockUnits;
        let newStockDoses = inventory.stockDoses;

        if (isFullUnit) {
          newStockUnits -= quantity;
        } else {
          let dosesToConsume = quantity;

          if (inventory.stockDoses >= dosesToConsume) {
            newStockDoses -= dosesToConsume;
          } else {
            dosesToConsume -= inventory.stockDoses;
            newStockDoses = 0;
            const unitsToOpen = Math.ceil(dosesToConsume / product.dosesPerUnit);
            newStockUnits -= unitsToOpen;
            newStockDoses = (unitsToOpen * product.dosesPerUnit) - dosesToConsume;
          }
        }

        inventory.stockUnits = newStockUnits;
        inventory.stockDoses = newStockDoses;
        inventory.lastMovement = new Date();
        await inventory.save({ session });

        // Crear movimiento
        const movement = new InventoryMovement({
          product: product._id,
          type: "salida",
          reason: "venta",
          quantityUnits: isFullUnit ? quantity : 0,
          quantityDoses: isFullUnit ? 0 : quantity,
          stockAfterUnits: newStockUnits,
          stockAfterDoses: newStockDoses,
          referenceType: "Sale",
          referenceId: sale._id,
          createdBy: req.user._id,
        });
        await movement.save({ session });
      }

      // Descontar crédito del owner si se usó
      if (creditUsed > 0 && ownerId) {
        await Owner.findByIdAndUpdate(
          ownerId,
          { $inc: { creditBalance: -creditUsed } },
          { session }
        );
      }

      // Crear factura automáticamente con detalle de cantidad
      const invoiceItems = processedItems.map(item => ({
        type: "producto" as const,
        resourceId: item.product,
        description: `${item.productName} (${item.quantity} ${item.isFullUnit ? item.unit : item.doseUnit})`,
        cost: item.isFullUnit ? item.unitPrice : item.pricePerDose,
        quantity: item.quantity,
      }));

      const invoice = new Invoice({
        ownerId: ownerId || undefined,
        ownerName: ownerData.name,
        ownerPhone: ownerData.phone,
        patientId: patientData?.id,
        veterinarianId: req.user._id,
        items: invoiceItems,
        currency: "USD",
        exchangeRate,
        total,
        amountPaidUSD: 0,
        amountPaidBs: 0,
        amountPaid: 0,
        paymentStatus: "Pendiente",
        date: new Date(),
      });

      await invoice.save({ session });

      // ==================== CREAR PAYMENTS ====================
      const paymentsCreated: any[] = [];

      // Payment por crédito usado
      if (creditUsed > 0) {
        const creditPayment = new Payment({
          invoiceId: invoice._id,
          amount: creditUsed,
          currency: "USD",
          exchangeRate: 1,
          amountUSD: creditUsed,
          isCredit: true,
          reference: "Crédito a favor",
          status: "active",
          createdBy: req.user._id,
        });
        await creditPayment.save({ session });
        paymentsCreated.push(creditPayment);

        // Actualizar invoice
        invoice.amountPaidUSD += creditUsed;
      }

      // Payment por monto en USD
      if (amountPaidUSD > 0) {
        const usdPayment = new Payment({
          invoiceId: invoice._id,
          amount: amountPaidUSD,
          currency: "USD",
          exchangeRate: 1,
          amountUSD: amountPaidUSD,
          paymentMethod: paymentMethodId || undefined,
          reference: paymentReference || undefined,
          isCredit: false,
          status: "active",
          createdBy: req.user._id,
        });
        await usdPayment.save({ session });
        paymentsCreated.push(usdPayment);

        // Actualizar invoice
        invoice.amountPaidUSD += amountPaidUSD;
      }

      // Payment por monto en Bs
      if (amountPaidBs > 0) {
        const bsPayment = new Payment({
          invoiceId: invoice._id,
          amount: amountPaidBs,
          currency: "Bs",
          exchangeRate: exchangeRate,
          amountUSD: amountPaidBs / exchangeRate,
          paymentMethod: paymentMethodId || undefined,
          reference: paymentReference || undefined,
          isCredit: false,
          status: "active",
          createdBy: req.user._id,
        });
        await bsPayment.save({ session });
        paymentsCreated.push(bsPayment);

        // Actualizar invoice
        invoice.amountPaidBs += amountPaidBs;
      }

      // Guardar invoice con montos actualizados (el middleware calculará amountPaid y paymentStatus)
      await invoice.save({ session });

      // Vincular factura a la venta
      sale.invoice = invoice._id as mongoose.Types.ObjectId;
      await sale.save({ session });

      await session.commitTransaction();

      // Obtener venta completa
      const populatedSale = await Sale.findById(sale._id)
        .populate("owner", "name contact creditBalance")
        .populate("patient", "name")
        .populate("invoice");

      res.status(201).json({
        msg: "Venta registrada correctamente",
        sale: populatedSale,
        invoiceId: invoice._id,
        paymentsCreated: paymentsCreated.length,
        changeAmount: sale.changeAmount,
      });

    } catch (error: any) {
      await session.abortTransaction();
      console.error("Error en createSale:", error);
      
      if (error.name === "ValidationError") {
        return res.status(400).json({ msg: "Datos inválidos", errors: error.errors });
      }
      
      res.status(500).json({ msg: "Error al registrar la venta" });
    } finally {
      session.endSession();
    }
  };

  // ==================== OBTENER VENTAS ====================
  static getSales = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const {
        status,
        isPaid,
        ownerId,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = req.query;

      const filter: any = { veterinarian: req.user._id };

      if (status) filter.status = status;
      if (isPaid !== undefined) filter.isPaid = isPaid === "true";
      if (ownerId) filter.owner = ownerId;
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }

      const sales = await Sale.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate("owner", "name contact")
        .populate("patient", "name")
        .populate("invoice", "paymentStatus total amountPaid");

      const total = await Sale.countDocuments(filter);

      res.json({
        sales,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error("Error en getSales:", error);
      res.status(500).json({ msg: "Error al obtener ventas" });
    }
  };

  // ==================== OBTENER VENTA POR ID ====================
  static getSaleById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID de venta inválido" });
      }

      const sale = await Sale.findOne({
        _id: id,
        veterinarian: req.user._id,
      })
        .populate("owner", "name contact creditBalance")
        .populate("patient", "name species breed")
        .populate("invoice");

      if (!sale) {
        return res.status(404).json({ msg: "Venta no encontrada" });
      }

      res.json({ sale });
    } catch (error: any) {
      console.error("Error en getSaleById:", error);
      res.status(500).json({ msg: "Error al obtener la venta" });
    }
  };

  // ==================== CANCELAR VENTA ====================
  static cancelSale = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { id } = req.params;
      const { reason } = req.body;

      const sale = await Sale.findOne({
        _id: id,
        veterinarian: req.user._id,
      }).session(session);

      if (!sale) {
        await session.abortTransaction();
        return res.status(404).json({ msg: "Venta no encontrada" });
      }

      if (sale.status === "cancelada") {
        await session.abortTransaction();
        return res.status(400).json({ msg: "La venta ya está cancelada" });
      }

      // Revertir inventario
      for (const item of sale.items) {
        const product = await Product.findById(item.product).session(session);
        
        const inventory = await Inventory.findOne({
          product: item.product,
          veterinarian: req.user._id,
        }).session(session);

        if (inventory) {
          if (item.isFullUnit) {
            inventory.stockUnits += item.quantity;
          } else {
            inventory.stockDoses += item.quantity;
            
            // Normalizar si hay más dosis que dosesPerUnit
            if (product && inventory.stockDoses >= product.dosesPerUnit) {
              const fullUnits = Math.floor(inventory.stockDoses / product.dosesPerUnit);
              inventory.stockUnits += fullUnits;
              inventory.stockDoses -= fullUnits * product.dosesPerUnit;
            }
          }
          
          inventory.lastMovement = new Date();
          await inventory.save({ session });

          // Crear movimiento de reversión
          const movement = new InventoryMovement({
            product: item.product,
            type: "entrada",
            reason: "devolucion",
            quantityUnits: item.isFullUnit ? item.quantity : 0,
            quantityDoses: item.isFullUnit ? 0 : item.quantity,
            stockAfterUnits: inventory.stockUnits,
            stockAfterDoses: inventory.stockDoses,
            referenceType: "Sale",
            referenceId: sale._id,
            notes: `Cancelación de venta: ${reason || "Sin razón especificada"}`,
            createdBy: req.user._id,
          });
          await movement.save({ session });
        }
      }

      // Devolver crédito si se usó
      if (sale.creditUsed > 0 && sale.owner) {
        await Owner.findByIdAndUpdate(
          sale.owner,
          { $inc: { creditBalance: sale.creditUsed } },
          { session }
        );
      }

      // Cancelar los pagos asociados
      if (sale.invoice) {
        await Payment.updateMany(
          { invoiceId: sale.invoice, status: "active" },
          { 
            status: "cancelled",
            cancelledAt: new Date(),
            cancelledBy: req.user._id,
            cancelledReason: `Cancelación de venta: ${reason || "Sin razón especificada"}`,
          },
          { session }
        );

        // Cancelar la factura
        await Invoice.findByIdAndUpdate(
          sale.invoice,
          { paymentStatus: "Cancelado" },
          { session }
        );
      }

      // Actualizar estado de la venta
      sale.status = "cancelada";
      await sale.save({ session });

      await session.commitTransaction();

      // Obtener venta actualizada
      const updatedSale = await Sale.findById(sale._id)
        .populate("owner", "name contact creditBalance")
        .populate("patient", "name")
        .populate("invoice");

      res.json({ 
        msg: "Venta cancelada correctamente",
        sale: updatedSale,
      });

    } catch (error: any) {
      await session.abortTransaction();
      console.error("Error en cancelSale:", error);
      res.status(500).json({ msg: "Error al cancelar la venta" });
    } finally {
      session.endSession();
    }
  };

  // ==================== RESUMEN DE VENTAS DEL DÍA ====================
  static getTodaySummary = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sales = await Sale.find({
        veterinarian: req.user._id,
        status: { $ne: "cancelada" },
        createdAt: { $gte: today, $lt: tomorrow },
      }).populate("owner", "name contact");

      const completedSales = sales.filter(s => s.status === "completada");
      const pendingSales = sales.filter(s => s.status === "pendiente");

      const summary = {
        totalSales: sales.length,
        completedCount: completedSales.length,
        pendingCount: pendingSales.length,
        totalAmount: sales.reduce((sum, sale) => sum + sale.total, 0),
        totalCollectedUSD: sales.reduce((sum, sale) => sum + sale.amountPaidUSD, 0),
        totalCollectedBs: sales.reduce((sum, sale) => sum + sale.amountPaidBs, 0),
        totalCreditUsed: sales.reduce((sum, sale) => sum + sale.creditUsed, 0),
        totalPending: sales.filter(s => !s.isPaid).reduce((sum, sale) => sum + (sale.total - sale.amountPaid), 0),
      };

      res.json({ summary, sales });
    } catch (error: any) {
      console.error("Error en getTodaySummary:", error);
      res.status(500).json({ msg: "Error al obtener resumen" });
    }
  };

  // ==================== RESUMEN POR RANGO DE FECHAS ====================
  static getSalesSummary = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ msg: "Se requieren fechas de inicio y fin" });
      }

      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      const sales = await Sale.find({
        veterinarian: req.user._id,
        status: { $ne: "cancelada" },
        createdAt: { $gte: start, $lte: end },
      });

      // Agrupar por día
      const salesByDay: Record<string, { count: number; total: number; paid: number }> = {};
      
      sales.forEach(sale => {
        const dayKey = sale.createdAt.toISOString().split('T')[0];
        if (!salesByDay[dayKey]) {
          salesByDay[dayKey] = { count: 0, total: 0, paid: 0 };
        }
        salesByDay[dayKey].count += 1;
        salesByDay[dayKey].total += sale.total;
        salesByDay[dayKey].paid += sale.amountPaid;
      });

      // Productos más vendidos
      const productSales: Record<string, { name: string; quantity: number; total: number }> = {};
      
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const key = item.product.toString();
          if (!productSales[key]) {
            productSales[key] = { name: item.productName, quantity: 0, total: 0 };
          }
          productSales[key].quantity += item.quantity;
          productSales[key].total += item.total;
        });
      });

      const topProducts = Object.entries(productSales)
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      const summary = {
        totalSales: sales.length,
        totalAmount: sales.reduce((sum, sale) => sum + sale.total, 0),
        totalCollected: sales.reduce((sum, sale) => sum + sale.amountPaid, 0),
        totalPending: sales.reduce((sum, sale) => sum + (sale.total - sale.amountPaid), 0),
        averageTicket: sales.length > 0 
          ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length 
          : 0,
        salesByDay,
        topProducts,
      };

      res.json({ summary });
    } catch (error: any) {
      console.error("Error en getSalesSummary:", error);
      res.status(500).json({ msg: "Error al obtener resumen de ventas" });
    }
  };

  // ==================== VALIDAR STOCK (para el frontend) ====================
  static validateStock = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ msg: "Items inválidos" });
      }

      const results: any[] = [];

      for (const item of items) {
        const { productId, quantity, isFullUnit = true } = item;

        const product = await Product.findOne({
          _id: productId,
          veterinarian: req.user._id,
          active: true,
        });

        if (!product) {
          results.push({
            productId,
            valid: false,
            error: "Producto no encontrado",
          });
          continue;
        }

        const inventory = await Inventory.findOne({
          product: productId,
          veterinarian: req.user._id,
        });

        if (!inventory) {
          results.push({
            productId,
            productName: product.name,
            valid: false,
            error: "Sin inventario",
            available: 0,
          });
          continue;
        }

        let available: number;
        let hasStock: boolean;

        if (isFullUnit) {
          available = inventory.stockUnits;
          hasStock = inventory.stockUnits >= quantity;
        } else {
          available = (inventory.stockUnits * product.dosesPerUnit) + inventory.stockDoses;
          hasStock = available >= quantity;
        }

        results.push({
          productId,
          productName: product.name,
          valid: hasStock,
          available,
          requested: quantity,
          unit: isFullUnit ? product.unit : product.doseUnit,
          error: hasStock ? null : "Stock insuficiente",
        });
      }

      const allValid = results.every(r => r.valid);

      res.json({ valid: allValid, items: results });
    } catch (error: any) {
      console.error("Error en validateStock:", error);
      res.status(500).json({ msg: "Error al validar stock" });
    }
  };
}