// src/controllers/PurchaseController.ts
import type { Request, Response } from "express";
import Product from "../models/Product";
import Inventory from "../models/Inventory";
import InventoryMovement from "../models/InventoryMovement";
import { Purchase, PurchaseItem } from "../models/Purchase";

export class PurchaseController {

  static createPurchase = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { provider, paymentMethod, items, notes } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ msg: "Debe incluir al menos un producto" });
      }

      let totalAmount = 0;
      const purchaseItems: any[] = [];

      // Validar y procesar cada ítem
      for (const item of items) {
        const { productId, quantity, unitCost } = item;

        if (!productId || !quantity || quantity <= 0 || unitCost === undefined || unitCost < 0) {
          return res.status(400).json({ msg: "Datos de producto inválidos" });
        }

        // Verificar que el producto existe y pertenece al veterinario
        const product = await Product.findOne({
          _id: productId,
          veterinarian: req.user._id
        });

        if (!product) {
          return res.status(404).json({ msg: "Producto no encontrado o no autorizado" });
        }

        const totalCost = quantity * unitCost;
        totalAmount += totalCost;

        // Crear ítem de compra
        const purchaseItem = new PurchaseItem({
          product: productId,
          productName: product.name,
          quantity,
          unitCost,
          totalCost,
        });
        await purchaseItem.save();
        purchaseItems.push(purchaseItem._id);

        // Actualizar inventario
        let inventory = await Inventory.findOne({
          product: productId,
          veterinarian: req.user._id
        });

        if (!inventory) {
          // Crear inventario si no existe
          inventory = new Inventory({
            product: productId,
            veterinarian: req.user._id,
            stockUnits: 0,
            stockDoses: 0,
          });
        }

        inventory.stockUnits += quantity;
        inventory.lastMovement = new Date();
        await inventory.save();

        // Registrar movimiento de inventario
        const movement = new InventoryMovement({
          product: productId,
          type: "entrada",
          reason: "compra",
          quantityUnits: quantity,
          quantityDoses: 0,
          stockAfterUnits: inventory.stockUnits,
          stockAfterDoses: inventory.stockDoses,
          createdBy: req.user._id,
        });
        await movement.save();
      }

      // Crear la compra
      const purchase = new Purchase({
        provider,
        totalAmount,
        paymentMethod,
        items: purchaseItems,
        notes,
        veterinarian: req.user._id,
      });

      await purchase.save();

      res.status(201).json({ msg: "Compra registrada correctamente", purchase });

    } catch (error: any) {
      console.error("Error en createPurchase:", error);
      if (error.code === 11000) {
        return res.status(400).json({ msg: "Error de duplicado en la compra" });
      }
      res.status(500).json({ msg: "Error al registrar la compra" });
    }
  };

  static getAllPurchases = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const purchases = await Purchase.find({
        veterinarian: req.user._id
      })
        .sort({ createdAt: -1 })
        .populate("items", "productName quantity unitCost totalCost");

      res.json({ purchases });
    } catch (error: any) {
      console.error("Error en getAllPurchases:", error);
      res.status(500).json({ msg: "Error al obtener compras" });
    }
  };

  static getPurchaseById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const purchase = await Purchase.findById(req.params.id)
        .populate("items", "productName quantity unitCost totalCost");

      if (!purchase || purchase.veterinarian.toString() !== req.user._id.toString()) {
        return res.status(404).json({ msg: "Compra no encontrada" });
      }

      res.json({ purchase });
    } catch (error: any) {
      console.error("Error en getPurchaseById:", error);
      res.status(500).json({ msg: "Error al obtener la compra" });
    }
  };
}