// src/controllers/OwnerController.ts
import type { Request, Response } from 'express';
import Owner from '../models/Owner';

export class OwnerController {
 
    // Crear un nuevo dueño
   
  static createOwner = async (req: Request, res: Response) => {
    if (!req.user || !req.user._id) {
      return res.status(400).json({ message: "Usuario no autenticado o sin ID" });
    }

    const owner = new Owner({
      ...req.body,
      veterinarian: req.user._id
    });

    try {
      await owner.save();

      return res.status(201).json({
        msg: 'Dueño creado correctamente',
        owner
      });
    } catch (error: any) {
      console.error('Error al crear dueño:', error);

      // Manejo de errores de duplicado (nationalId, email)
      if (error.code === 11000) {
        const duplicateKey = Object.keys(error.keyValue)[0];
        let fieldLabel = 'campo';

        if (duplicateKey === 'nationalId') {
          fieldLabel = 'ID nacional';
        } else if (duplicateKey === 'email') {
          fieldLabel = 'correo electrónico';
        }

        return res.status(409).json({
          msg: `${fieldLabel} ya está registrado en el sistema`,
          duplicateField: duplicateKey
        });
      }

      // Otros errores (ej: validación fallida, etc.)
      return res.status(500).json({
        msg: 'Error interno del servidor'
      });
    }
  };

 
    // Obtener todos los dueños del veterinario autenticado
   
  static getAllOwners = async (req: Request, res: Response) => {
    try {
      const owners = await Owner.find({
        veterinarian: req.user._id
      }).sort({ createdAt: -1 });

      return res.json(owners);
    } catch (error: any) {
      console.error('Error al obtener dueños:', error);
      return res.status(500).json({
        msg: 'Error interno del servidor'
      });
    }
  };

  
    // Obtener dueño por ID (con mascotas)
   
  static getOwnerById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const owner = await Owner.findById(id).populate('pets');

      if (!owner) {
        return res.status(404).json({ msg: 'Dueño no encontrado' });
      }

      if (owner.veterinarian.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: 'Acción no autorizada' });
      }

      return res.json(owner);
    } catch (error: any) {
      console.error('Error en getOwnerById:', error);

      if (error.name === 'CastError') {
        return res.status(400).json({ msg: 'ID inválido' });
      }

      return res.status(500).json({ msg: 'Error interno del servidor' });
    }
  };

  //  Actualizar dueño por ID
   
  static updateOwner = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const updatedOwner = await Owner.findByIdAndUpdate(
        id,
        req.body,
        {
          new: true,
          runValidators: true, 
          context: 'query'
        }
      );

      if (!updatedOwner) {
        return res.status(404).json({ msg: 'Dueño no encontrado' });
      }

      if (updatedOwner.veterinarian.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: 'No tienes autorización para realizar esta acción' });
      }

      return res.json({
        msg: 'Dueño actualizado correctamente',
        owner: updatedOwner
      });
    } catch (error: any) {
      console.error('Error en updateOwner:', error);

      if (error.name === 'CastError') {
        return res.status(400).json({ msg: 'ID no válido' });
      }

      // Manejo de duplicado al actualizar (si nationalId o email se cambian a uno existente)
      if (error.code === 11000) {
        const duplicateKey = Object.keys(error.keyValue)[0];
        let fieldLabel = 'campo';
        if (duplicateKey === 'nationalId') fieldLabel = 'ID nacional';
        else if (duplicateKey === 'email') fieldLabel = 'correo electrónico';

        return res.status(409).json({
          msg: `${fieldLabel} ya está registrado en el sistema`,
          duplicateField: duplicateKey
        });
      }

      return res.status(500).json({ msg: 'Error interno del servidor' });
    }
  };

  
    // Eliminar un dueño por ID
   
  static deleteOwner = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const deletedOwner = await Owner.findByIdAndDelete(id);

      if (!deletedOwner) {
        return res.status(404).json({ msg: 'Dueño no encontrado' });
      }

      if (deletedOwner.veterinarian.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: 'No tienes autorización para realizar esta acción' });
      }

      return res.json({
        msg: 'Dueño eliminado correctamente'
      });
    } catch (error: any) {
      console.error('Error en deleteOwner:', error);

      if (error.name === 'CastError') {
        return res.status(400).json({ msg: 'ID no válido' });
      }

      return res.status(500).json({ msg: 'Error interno del servidor' });
    }
  };
}