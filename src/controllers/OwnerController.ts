// src/controllers/OwnerController.ts
import type { Request, Response } from 'express';
import Owner from '../models/Owner';

export class OwnerController {
  /**
   * Crear un nuevo dueño
   * (Las validaciones ya fueron hechas por el middleware)
   */
  static createOwner = async (req: Request, res: Response) => {
    // asigna el veterinario
    
    const owner = new Owner(req.body);

      // ✅ Verifica que req.user y req.user._id existan
  if (!req.user || !req.user._id) {
    return res.status(400).json({ message: "Usuario no autenticado o sin ID" });
  }

    owner.veterinarian = req.user._id;
    try {
      await owner.save();

      res.status(201).json({
        msg: 'Dueño creado correctamente',
        owner
      });
    } catch (error: any) {
      // Si llega aquí, es un error inesperado (ej: falla de BD)
      console.error('Error inesperado al crear dueño:', error);
      res.status(500).json({
        msg: 'Error interno del servidor'
      });
    }
  };

/**
 * Obtener todos los dueños
 */
static getAllOwners = async (req: Request, res: Response) => {
  try {
    const owners = await Owner.find({
      $or:[
        {
          veterinarian: {$in: req.user._id}
        }
      ]
    }).sort({ createdAt: -1 }); // Los más recientes primero
    res.json(owners);
  } catch (error: any) {
    
    res.status(500).json({
      msg: 'Error interno del servidor'
    });
  }
};
  

/**
 * Obtener dueño por ID (con sus mascotas)
 */
static getOwnerById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const owner = await Owner.findById(id).populate('pets');

    if (!owner) {
      return res.status(404).json({
        msg: 'Dueño no encontrado'
      });
    }

    if(owner.veterinarian.toString() !== req.user._id.toString()){
       return res.status(404).json({
        msg: 'Accion no valida'
      });
    }

    res.json(owner); 
  } catch (error: any) {
    console.error('Error en getOwnerById:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: 'ID inválido'
      });
    }

    res.status(500).json({
      msg: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar dueño por ID
 */
static updateOwner = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const updatedOwner = await Owner.findByIdAndUpdate(
      id,
      req.body
      
    );

    if (!updatedOwner || !updatedOwner.veterinarian) {
      return res.status(404).json({
        msg: 'Dueño no encontrado'
      });
    }

     if(updatedOwner.veterinarian.toString() !== req.user._id.toString()){
       return res.status(404).json({
        msg: 'No tienes autorizacion para realizar esta accion'
      });
    }

    res.json({
      msg: 'Dueño actualizado correctamente',
      owner: updatedOwner
    });
  } catch (error: any) {
    // Manejo de errores (ej: ID inválido, error de BD)
    console.error('Error en updateOwner:', error);

    // Si el ID no es válido (aunque el middleware debería haberlo atrapado)
    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: 'ID no válido'
      });
    }

    res.status(500).json({
      msg: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar un dueño por ID
 */
static deleteOwner = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deletedOwner = await Owner.findByIdAndDelete(id);

    if (!deletedOwner || !deletedOwner.veterinarian) {
      return res.status(404).json({
        msg: 'Dueño no encontrado'
      });
    }

     if(deletedOwner.veterinarian.toString() !== req.user._id.toString()){
       return res.status(404).json({
        msg: 'No tienes autorizacion para realizar esta accion'
      });
    }

    res.json({
      msg: 'Dueño eliminado correctamente'
    });
  } catch (error: any) {
    console.error('Error en deleteOwner:', error);

    // Si el ID no es válido (aunque el middleware debería haberlo atrapado)
    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: 'ID no válido'
      });
    }

    res.status(500).json({
      msg: 'Error interno del servidor'
    });
  }
};

}