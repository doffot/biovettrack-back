// src/controllers/PaymentController.ts
import type { Request, Response } from "express";
import mongoose from "mongoose";
import Payment from "../models/Payment";
import Invoice from "../models/Invoice";
import Owner from "../models/Owner";

export class PaymentController {
  
  /* ---------- CREAR PAGO ---------- */
  static createPayment = async (req: Request, res: Response) => {
  
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { 
        invoiceId, 
        amount = 0, 
        currency, 
        exchangeRate, 
        paymentMethod, 
        reference,
        creditAmountUsed = 0
      } = req.body;

   

      // Validar que la factura existe y pertenece al veterinario
      const invoice = await Invoice.findOne({
        _id: invoiceId,
        veterinarianId: req.user._id,
      });

      if (!invoice) {
        return res.status(404).json({ msg: "Factura no encontrada" });
      }

      // Validar que la factura no esté pagada o cancelada
      if (invoice.paymentStatus === "Pagado") {
        return res.status(400).json({ msg: "La factura ya está pagada" });
      }

      if (invoice.paymentStatus === "Cancelado") {
        return res.status(400).json({ msg: "La factura está cancelada" });
      }

      // Validar que hay algo que pagar
      if (amount <= 0 && creditAmountUsed <= 0) {
        return res.status(400).json({ msg: "Debe especificar un monto o crédito a usar" });
      }

      // Procesar crédito si se usa
      if (creditAmountUsed > 0) {
        if (!invoice.ownerId) {
          return res.status(400).json({ msg: "La factura no tiene propietario asociado" });
        }

        const ownerId = typeof invoice.ownerId === "object" 
          ? (invoice.ownerId as any)._id 
          : invoice.ownerId;
        
        const owner = await Owner.findById(ownerId);
        
        if (!owner) {
          return res.status(404).json({ msg: "Propietario no encontrado" });
        }

        if (owner.creditBalance < creditAmountUsed) {
          return res.status(400).json({ 
            msg: `Crédito insuficiente. Disponible: $${owner.creditBalance.toFixed(2)}` 
          });
        }

        // Restar crédito del owner
        await Owner.findByIdAndUpdate(ownerId, {
          $inc: { creditBalance: -creditAmountUsed }
        });

        // Registrar el uso de crédito como un "pago" especial
        const creditPayment = new Payment({
          invoiceId,
          amount: creditAmountUsed,
          currency: "USD",
          exchangeRate: 1,
          paymentMethod: null,
          reference: "Pago con crédito a favor",
          createdBy: req.user._id,
          isCredit: true,
        });

        await creditPayment.save();
        console.log(`✅ Pago con crédito creado: $${creditAmountUsed}`);
  console.log(`✅ Crédito restado del owner ${ownerId}`);
      }

      // Crear pago normal solo si hay amount > 0
      let populatedPayment = null;
      
      if (amount > 0) {
        if (!paymentMethod) {
          return res.status(400).json({ msg: "Debe seleccionar un método de pago" });
        }

        const payment = new Payment({
          invoiceId,
          amount,
          currency,
          exchangeRate,
          paymentMethod,
          reference,
          createdBy: req.user._id,
          isCredit: false,
        });

        await payment.save();

        populatedPayment = await Payment.findById(payment._id)
          .populate("paymentMethod", "name currency")
          .populate("createdBy", "name lastName");
      }


      console.log(`🔄 Recalculando factura ${invoiceId}...`);
      // Recalcular totales de la factura
      await PaymentController.recalculateInvoice(invoiceId);

      // Obtener la factura actualizada
      const updatedInvoice = await Invoice.findById(invoiceId)
        .populate("ownerId", "name contact creditBalance")
        .populate("patientId", "name")
        .populate("paymentMethod", "name");
        console.log(`📊 Factura actualizada:`, {
  total: updatedInvoice.total,
  amountPaid: updatedInvoice.amountPaid,
  paymentStatus: updatedInvoice.paymentStatus
})

      // Mensaje de respuesta
      let msg = "Pago registrado correctamente";
      if (creditAmountUsed > 0 && amount > 0) {
        msg = `Pago registrado (incluye $${creditAmountUsed.toFixed(2)} de crédito)`;
      } else if (creditAmountUsed > 0 && amount <= 0) {
        msg = `Pago con crédito registrado ($${creditAmountUsed.toFixed(2)})`;
      }

      res.status(201).json({
        msg,
        payment: populatedPayment,
        invoice: updatedInvoice,
        creditUsed: creditAmountUsed,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ msg: "Datos inválidos", errors: error.errors });
      }
      console.error("Error en createPayment:", error);
      return res.status(500).json({ msg: "Error al registrar el pago" });
    }
  };

  /* ---------- OBTENER PAGOS DE UNA FACTURA ---------- */
  static getPaymentsByInvoice = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { invoiceId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        return res.status(400).json({ msg: "ID de factura inválido" });
      }

      // Verificar que la factura pertenece al veterinario
      const invoice = await Invoice.findOne({
        _id: invoiceId,
        veterinarianId: req.user._id,
      });

      if (!invoice) {
        return res.status(404).json({ msg: "Factura no encontrada" });
      }

      const payments = await Payment.find({ invoiceId })
        .sort({ createdAt: -1 })
        .populate("paymentMethod", "name currency")
        .populate("createdBy", "name lastName")
        .populate("cancelledBy", "name lastName");

      res.json({ payments });
    } catch (error: any) {
      console.error("Error en getPaymentsByInvoice:", error);
      return res.status(500).json({ msg: "Error al obtener los pagos" });
    }
  };

  /* ---------- CANCELAR PAGO ---------- */
  static cancelPayment = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { paymentId } = req.params;
      const { reason } = req.body;

      if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        return res.status(400).json({ msg: "ID de pago inválido" });
      }

      // Buscar el pago
      const payment = await Payment.findById(paymentId);

      if (!payment) {
        return res.status(404).json({ msg: "Pago no encontrado" });
      }

      // Verificar que la factura pertenece al veterinario
      const invoice = await Invoice.findOne({
        _id: payment.invoiceId,
        veterinarianId: req.user._id,
      });

      if (!invoice) {
        return res.status(404).json({ msg: "Factura no encontrada" });
      }

      // Verificar que el pago no esté ya cancelado
      if (payment.status === "cancelled") {
        return res.status(400).json({ msg: "El pago ya está cancelado" });
      }

      // Si el pago fue con crédito, devolver el crédito al owner
      if (payment.isCredit && invoice.ownerId) {
        const ownerId = typeof invoice.ownerId === "object" 
          ? (invoice.ownerId as any)._id 
          : invoice.ownerId;

        await Owner.findByIdAndUpdate(ownerId, {
          $inc: { creditBalance: payment.amount }
        });
      }

      // Cancelar el pago
      payment.status = "cancelled";
      payment.cancelledAt = new Date();
      payment.cancelledBy = req.user._id;
      payment.cancelledReason = reason || "Sin razón especificada";

      await payment.save();

      // Recalcular Invoice
      await PaymentController.recalculateInvoice(payment.invoiceId.toString());

      // Obtener datos actualizados
      const updatedPayment = await Payment.findById(paymentId)
        .populate("paymentMethod", "name currency")
        .populate("createdBy", "name lastName")
        .populate("cancelledBy", "name lastName");

      const updatedInvoice = await Invoice.findById(payment.invoiceId)
        .populate("ownerId", "name contact creditBalance")
        .populate("patientId", "name")
        .populate("paymentMethod", "name");

      res.json({
        msg: payment.isCredit 
          ? "Pago con crédito anulado (crédito devuelto al propietario)"
          : "Pago anulado correctamente",
        payment: updatedPayment,
        invoice: updatedInvoice,
      });
    } catch (error: any) {
      console.error("Error en cancelPayment:", error);
      return res.status(500).json({ msg: "Error al anular el pago" });
    }
  };

  /* ---------- OBTENER TODOS LOS PAGOS DEL VETERINARIO ---------- */
  static getMyPayments = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

      const filter: any = { createdBy: req.user._id };

      if (status) {
        filter.status = status;
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          filter.createdAt.$gte = new Date(startDate as string);
        }
        if (endDate) {
          filter.createdAt.$lte = new Date(endDate as string);
        }
      }

      const payments = await Payment.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate("invoiceId", "total paymentStatus")
        .populate("paymentMethod", "name currency")
        .populate("createdBy", "name lastName");

      const total = await Payment.countDocuments(filter);

      res.json({
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error("Error en getMyPayments:", error);
      return res.status(500).json({ msg: "Error al obtener los pagos" });
    }
  };

  /* ---------- HELPER: RECALCULAR INVOICE DESDE PAGOS ---------- */
  private static recalculateInvoice = async (invoiceId: string) => {
    const payments = await Payment.find({
      invoiceId,
      status: "active",
    });

    let totalUSD = 0;
    let totalBs = 0;
    let lastRate = 1;

    for (const payment of payments) {
      if (payment.currency === "USD") {
        totalUSD += payment.amount;
      } else if (payment.currency === "Bs") {
        totalBs += payment.amount;
      }
      if (payment.exchangeRate > 0) {
        lastRate = payment.exchangeRate;
      }
    }

    // Calcular total en USD
    const bsToUSD = lastRate > 0 ? totalBs / lastRate : 0;
    const amountPaid = totalUSD + bsToUSD;

    // Obtener la factura
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return;

    // Determinar estado
    const tolerance = 0.01;
    let paymentStatus: "Pendiente" | "Parcial" | "Pagado";
    
    if (amountPaid >= invoice.total - tolerance) {
      paymentStatus = "Pagado";
    } else if (amountPaid > 0) {
      paymentStatus = "Parcial";
    } else {
      paymentStatus = "Pendiente";
    }

    // Actualizar factura
    await Invoice.updateOne(
      { _id: invoiceId },
      {
        amountPaidUSD: totalUSD,
        amountPaidBs: totalBs,
        amountPaid: amountPaid,
        exchangeRate: lastRate,
        paymentStatus: paymentStatus,
      }
    );
  };
}