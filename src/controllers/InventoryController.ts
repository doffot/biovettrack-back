// src/controllers/InventoryController.ts
import type { NextFunction, Request, Response } from "express";
import Product from "../models/Product";
import Inventory from "../models/Inventory";
import InventoryMovement, { MovementReason, MovementType } from "../models/InventoryMovement";
import { ValidationChain } from "express-validator";

export class InventoryController {
  static getMovements(arg0: string, arg1: ValidationChain[], handleInputErrors: (req: Request, res: Response, next: NextFunction) => void, getMovements: any) {
    throw new Error("Method not implemented.");
  }

  // Helper: obtener inventario garantizando pertenencia
  private static async findInventory(productId: string, vetId: string) {
    const inventory = await Inventory.findOne({ 
      product: productId, 
      veterinarian: vetId 
    });
    if (!inventory) {
      throw new Error("Inventario no encontrado");
    }
    return inventory;
  }

  // Helper: obtener producto (para dosesPerUnit, divisible, etc.)
  private static async getProduct(productId: string, vetId: string) {
    const product = await Product.findOne({ _id: productId, veterinarian: vetId });
    if (!product) {
      throw new Error("Producto no encontrado");
    }
    return product;
  }

  // Crear inventario inicial para un producto
  static initializeInventory = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { productId, stockUnits = 0, stockDoses = 0 } = req.body;

      // Verificar que el producto existe y pertenece al veterinario
      await this.getProduct(productId, req.user._id.toString());

      // Verificar que no exista ya un inventario
      const existing = await Inventory.findOne({ product: productId, veterinarian: req.user._id });
      if (existing) {
        return res.status(400).json({ msg: "El inventario para este producto ya existe" });
      }

      // Crear inventario
      const inventory = new Inventory({
        product: productId,
        veterinarian: req.user._id,
        stockUnits,
        stockDoses,
      });

      await inventory.save();

      // Registrar movimiento inicial
      const movement = new InventoryMovement({
        product: productId,
        type: "entrada" as MovementType,
        reason: "stock_inicial" as MovementReason,
        quantityUnits: stockUnits,
        quantityDoses: stockDoses,
        stockAfterUnits: stockUnits,
        stockAfterDoses: stockDoses,
        createdBy: req.user._id,
      });

      await movement.save();

      res.status(201).json({ msg: "Inventario inicializado", inventory });
    } catch (error: any) {
      console.error("Error en initializeInventory:", error);
      res.status(500).json({ msg: error.message || "Error al inicializar inventario" });
    }
  };

  // Consumir stock (usado en desparasitación, vacunas, etc.)
  static consumeStock = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { productId } = req.params;
      const { quantity, isFullUnit = false, reason = "uso_clinico", referenceType, referenceId } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ msg: "La cantidad debe ser mayor a 0" });
      }

      const product = await this.getProduct(productId, req.user._id.toString());
      let inventory = await this.findInventory(productId, req.user._id.toString());

      let newStockUnits = inventory.stockUnits;
      let newStockDoses = inventory.stockDoses;

      if (isFullUnit) {
        // Consumir unidades completas
        if (inventory.stockUnits < quantity) {
          return res.status(400).json({ 
            msg: `Stock insuficiente. Solo hay ${inventory.stockUnits} ${product.unit}(s) disponibles` 
          });
        }
        newStockUnits -= quantity;
      } else {
        // Consumir dosis/fracciones
        if (!product.divisible) {
          return res.status(400).json({ 
            msg: "Este producto no es divisible. Solo se puede consumir por unidad completa" 
          });
        }

        const totalDoses = (inventory.stockUnits * product.dosesPerUnit) + inventory.stockDoses;
        if (totalDoses < quantity) {
          return res.status(400).json({ 
            msg: `Stock insuficiente. Solo hay ${totalDoses} ${product.doseUnit} disponibles` 
          });
        }

        let dosesToConsume = quantity;

        // Primero usar dosis sueltas
        if (inventory.stockDoses >= dosesToConsume) {
          newStockDoses -= dosesToConsume;
        } else {
          dosesToConsume -= inventory.stockDoses;
          newStockDoses = 0;

          // Abrir unidades necesarias
          const unitsToOpen = Math.ceil(dosesToConsume / product.dosesPerUnit);
          if (inventory.stockUnits < unitsToOpen) {
            return res.status(400).json({ msg: "Stock insuficiente en unidades" });
          }
          newStockUnits -= unitsToOpen;
          newStockDoses = (unitsToOpen * product.dosesPerUnit) - dosesToConsume;
        }
      }

      // Actualizar inventario
      inventory.stockUnits = newStockUnits;
      inventory.stockDoses = newStockDoses;
      inventory.lastMovement = new Date();
      await inventory.save();

      // Crear movimiento
      const movement = new InventoryMovement({
        product: productId,
        type: "salida" as MovementType,
        reason: reason as MovementReason,
        quantityUnits: isFullUnit ? quantity : 0,
        quantityDoses: isFullUnit ? 0 : quantity,
        stockAfterUnits: newStockUnits,
        stockAfterDoses: newStockDoses,
        referenceType,
        referenceId,
        createdBy: req.user._id,
      });

      await movement.save();

      res.json({ 
        msg: "Stock consumido correctamente",
        inventory,
        movement: {
          id: movement._id,
          consumed: isFullUnit ? `${quantity} ${product.unit}(s)` : `${quantity} ${product.doseUnit}`,
        }
      });

    } catch (error: any) {
      console.error("Error en consumeStock:", error);
      res.status(500).json({ msg: error.message || "Error al consumir stock" });
    }
  };

  // Obtener inventario de un producto
  static getInventory = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const { productId } = req.params;
      const inventory = await Inventory.findOne({ 
        product: productId, 
        veterinarian: req.user._id.toString() 
      }).populate("product");

      if (!inventory) {
        return res.status(404).json({ msg: "Inventario no encontrado" });
      }

      res.json({ inventory });
    } catch (error: any) {
      console.error("Error en getInventory:", error);
      res.status(500).json({ msg: "Error al obtener inventario" });
    }
  };

  // Obtener productos con stock bajo
  static getLowStockProducts = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const inventories = await Inventory.find({ 
        veterinarian: req.user._id.toString(),
        $expr: { $lte: ["$stockUnits", 5] } // Mejorar: usar minStock del producto
      }).populate("product");

      // Filtrar solo productos activos
      const lowStockProducts = inventories
        .filter(inv => (inv.product as any).active)
        .map(inv => ({
          ...inv.product,
          stockUnits: inv.stockUnits,
          stockDoses: inv.stockDoses,
        }));

      res.json({ products: lowStockProducts });
    } catch (error: any) {
      console.error("Error en getLowStockProducts:", error);
      res.status(500).json({ msg: "Error al obtener productos con stock bajo" });
    }
  };
}