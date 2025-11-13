// controllers/PaymentMethodController.ts
import type { Request, Response } from "express";
import PaymentMethod from "../models/PaymentMethod";
import mongoose from "mongoose";

export class PaymentMethodController {
  
  /* ---------- OBTENER TODOS LOS MÉTODOS DE PAGO DEL VETERINARIO ---------- */
  static getPaymentMethods = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const paymentMethods = await PaymentMethod.find({
        veterinarian: req.user._id,
        isActive: true
      }).sort({ name: 1 });

      res.json({
        success: true,
        paymentMethods
      });

    } catch (error: any) {
      console.error('Error en getPaymentMethods:', error);
      res.status(500).json({
        success: false,
        msg: 'Error al obtener métodos de pago'
      });
    }
  };

  /* ---------- CREAR MÉTODO DE PAGO ---------- */
  static createPaymentMethod = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const { name, description, currency, paymentMode, requiresReference } = req.body;

      // Verificar si ya existe un método con el mismo nombre para este veterinario
      const existingMethod = await PaymentMethod.findOne({
        name,
        veterinarian: req.user._id
      });

      if (existingMethod) {
        return res.status(400).json({
          success: false,
          msg: 'Ya existe un método de pago con este nombre'
        });
      }

      const paymentMethod = new PaymentMethod({
        name,
        description,
        currency,
        paymentMode,
        requiresReference: requiresReference || false,
        veterinarian: req.user._id
      });

      await paymentMethod.save();

      res.status(201).json({
        success: true,
        msg: 'Método de pago creado correctamente',
        paymentMethod
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          msg: "Datos inválidos",
          errors: error.errors
        });
      }
      console.error('Error en createPaymentMethod:', error);
      res.status(500).json({
        success: false,
        msg: 'Error al crear método de pago'
      });
    }
  };

  /* ---------- ACTUALIZAR MÉTODO DE PAGO ---------- */
  static updatePaymentMethod = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          msg: 'ID de método de pago inválido'
        });
      }

      // Verificar que el método existe y pertenece al veterinario
      const existingMethod = await PaymentMethod.findOne({
        _id: id,
        veterinarian: req.user._id
      });

      if (!existingMethod) {
        return res.status(404).json({
          success: false,
          msg: 'Método de pago no encontrado'
        });
      }

      // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
      if (updateData.name && updateData.name !== existingMethod.name) {
        const duplicateMethod = await PaymentMethod.findOne({
          name: updateData.name,
          veterinarian: req.user._id,
          _id: { $ne: id }
        });

        if (duplicateMethod) {
          return res.status(400).json({
            success: false,
            msg: 'Ya existe otro método de pago con este nombre'
          });
        }
      }

      const updatedMethod = await PaymentMethod.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        msg: 'Método de pago actualizado correctamente',
        paymentMethod: updatedMethod
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          msg: "Datos inválidos",
          errors: error.errors
        });
      }
      console.error('Error en updatePaymentMethod:', error);
      res.status(500).json({
        success: false,
        msg: 'Error al actualizar método de pago'
      });
    }
  };

  /* ---------- ELIMINAR MÉTODO DE PAGO (DESACTIVAR) ---------- */
  static deletePaymentMethod = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          msg: 'ID de método de pago inválido'
        });
      }

      // Verificar que el método existe y pertenece al veterinario
      const existingMethod = await PaymentMethod.findOne({
        _id: id,
        veterinarian: req.user._id
      });

      if (!existingMethod) {
        return res.status(404).json({
          success: false,
          msg: 'Método de pago no encontrado'
        });
      }

      // En lugar de eliminar, desactivamos el método
      await PaymentMethod.findByIdAndUpdate(id, { isActive: false });

      res.json({
        success: true,
        msg: 'Método de pago eliminado correctamente'
      });

    } catch (error: any) {
      console.error('Error en deletePaymentMethod:', error);
      res.status(500).json({
        success: false,
        msg: 'Error al eliminar método de pago'
      });
    }
  };

  /* ---------- OBTENER MÉTODO DE PAGO POR ID ---------- */
  static getPaymentMethodById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          msg: 'ID de método de pago inválido'
        });
      }

      const paymentMethod = await PaymentMethod.findOne({
        _id: id,
        veterinarian: req.user._id
      });

      if (!paymentMethod) {
        return res.status(404).json({
          success: false,
          msg: 'Método de pago no encontrado'
        });
      }

      res.json({
        success: true,
        paymentMethod
      });

    } catch (error: any) {
      console.error('Error en getPaymentMethodById:', error);
      res.status(500).json({
        success: false,
        msg: 'Error al obtener método de pago'
      });
    }
  };
}