// src/controllers/ProductController.ts
import type { Request, Response } from "express";
import Product from "../models/Product";
import Inventory from "../models/Inventory";

export class ProductController {
  
  static createProduct = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const productData = {
        ...req.body,
        veterinarian: req.user._id,
      };

      const product = new Product(productData);
      await product.save();
      res.status(201).json({ msg: "Producto creado correctamente", product });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ msg: "El nombre del producto ya existe" });
      }
      if (error.name === "ValidationError") {
        return res.status(400).json({ msg: error.message });
      }
      console.error("Error en createProduct:", error);
      res.status(500).json({ msg: "Error al crear el producto" });
    }
  };

  static getAllProducts = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const products = await Product.find({ 
        veterinarian: req.user._id
      }).sort({ name: 1 });
      res.json({ products });
    } catch (error: any) {
      console.error("Error en getAllProducts:", error);
      res.status(500).json({ msg: "Error al obtener productos" });
    }
  };

  static getActiveProducts = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const products = await Product.find({ 
        veterinarian: req.user._id,
        active: true 
      }).sort({ name: 1 });
      res.json({ products });
    } catch (error: any) {
      console.error("Error en getActiveProducts:", error);
      res.status(500).json({ msg: "Error al obtener productos activos" });
    }
  };


  static getProductsWithInventory = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: "Usuario no autenticado" });
    }

    // Obtener productos activos
    const products = await Product.find({ 
      veterinarian: req.user._id,
      active: true 
    }).sort({ name: 1 });
    
    // Obtener todos los inventarios para estos productos
    const productIds = products.map(p => p._id);
    const inventories = await Inventory.find({
      product: { $in: productIds },
      veterinarian: req.user._id
    });
    
    // Combinar productos con inventario
    const productsWithInventory = products.map(product => {
      const inventory = inventories.find(inv => 
        inv.product.toString() === product._id.toString()
      );
      
      return {
        ...product.toObject(),
        inventory: inventory ? {
          stockUnits: inventory.stockUnits,
          stockDoses: inventory.stockDoses
        } : {
          stockUnits: 0,
          stockDoses: 0
        }
      };
    });
    
    res.json({ products: productsWithInventory });
  } catch (error: any) {
    console.error("Error en getProductsWithInventory:", error);
    res.status(500).json({ msg: "Error al obtener productos con inventario" });
  }
};


  static getProductById = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const product = await Product.findOne({
        _id: req.params.id,
        veterinarian: req.user._id
      });

      if (!product) {
        return res.status(404).json({ msg: "Producto no encontrado" });
      }
      res.json({ product });
    } catch (error: any) {
      console.error("Error en getProductById:", error);
      res.status(500).json({ msg: "Error al obtener el producto" });
    }
  };

  static updateProduct = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const product = await Product.findOneAndUpdate(
        { 
          _id: req.params.id,
          veterinarian: req.user._id
        },
        req.body,
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({ msg: "Producto no encontrado" });
      }

      res.json({ msg: "Producto actualizado correctamente", product });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ msg: "El nombre del producto ya existe" });
      }
      if (error.name === "ValidationError") {
        return res.status(400).json({ msg: error.message });
      }
      console.error("Error en updateProduct:", error);
      res.status(500).json({ msg: "Error al actualizar el producto" });
    }
  };

  static deleteProduct = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      const product = await Product.findOneAndDelete({
        _id: req.params.id,
        veterinarian: req.user._id
      });

      if (!product) {
        return res.status(404).json({ msg: "Producto no encontrado" });
      }

      res.json({ msg: "Producto eliminado correctamente" });
    } catch (error: any) {
      console.error("Error en deleteProduct:", error);
      res.status(500).json({ msg: "Error al eliminar el producto" });
    }
  };
}