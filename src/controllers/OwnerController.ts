// src/controllers/OwnerController.ts
import type { Request, Response } from 'express';
import Owner from '../models/Owner';
import Appointment from '../models/Appointment';
import Patient from '../models/Patient';
import GroomingService from '../models/GroomingService';
import Invoice from '../models/Invoice';

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
      // 1. Obtener dueños
      const owners = await Owner.find({ veterinarian: req.user._id })
        .sort({ createdAt: -1 })
        .lean();

      // 2. Procesar datos extra
      const ownersWithStats = await Promise.all(owners.map(async (owner) => {
        
        // --- A. MASCOTAS (Modelo Patient) ---
        // Contamos cuántos pacientes tienen a este owner._id
        const petsCount = await Patient.countDocuments({ owner: owner._id });

        // --- B. ÚLTIMA VISITA Y DEUDA (Modelo Invoice) ---
        // Buscamos todas las facturas de este dueño para sacar ambos datos de una vez
        // (O podemos hacer dos consultas rápidas, lo haré separado para mayor claridad)

        // 1. Búsqueda de Última Visita (Basada en la última factura generada)
        const lastInvoice = await Invoice.findOne({ ownerId: owner._id })
          .sort({ date: -1 }) // La más reciente primero
          .select('date');

        // 2. Búsqueda de Deuda (Facturas Pendientes o Parciales)
        const debtInvoices = await Invoice.find({
          ownerId: owner._id,
          paymentStatus: { $in: ['Pendiente', 'Parcial'] }
        }).select('total amountPaid');

        // Calculamos el total adeudado
        const totalDebt = debtInvoices.reduce((acc, inv) => {
          // Si el total es 100 y pagó 20, debe 80.
          // Si amountPaid es null o undefined, asumimos 0.
          const debt = inv.total - (inv.amountPaid || 0);
          return acc + (debt > 0 ? debt : 0);
        }, 0);

        const pendingInvoicesCount = debtInvoices.length;

        // --- C. RETORNAR ---
        return {
          ...owner,
          petsCount,
          lastVisit: lastInvoice ? lastInvoice.date : null, // Fecha de la última factura
          totalDebt,
          pendingInvoices: pendingInvoicesCount
        };
      }));

      return res.json(ownersWithStats);

    } catch (error: any) {
      console.error('Error en getAllOwners:', error);
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


  
  // Obtener citas activas de todas las mascotas de un owner
 
static getOwnerAppointments = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: 'Usuario no autenticado' });
    }

    // Verificar que el owner existe y pertenece al veterinario
    const owner = await Owner.findById(id);
    if (!owner) {
      return res.status(404).json({ msg: 'Dueño no encontrado' });
    }

    if (owner.veterinarian.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Acción no autorizada' });
    }

    // Obtener todas las mascotas del owner
    const patients = await Patient.find({ owner: id }).select('_id name');
    const patientIds = patients.map(p => p._id);

    if (patientIds.length === 0) {
      return res.json({ appointments: [], totalCount: 0 });
    }

    // Obtener citas activas (Programada) de todas las mascotas
    const appointments = await Appointment.find({
      patient: { $in: patientIds },
      status: 'Programada'
    })
      .populate('patient', 'name species photo')
      .sort({ date: 1 });

    return res.json({
      appointments,
      totalCount: appointments.length
    });

  } catch (error: any) {
    console.error('Error en getOwnerAppointments:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ msg: 'ID inválido' });
    }

    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

/**
 * Obtener servicios de grooming de todas las mascotas de un owner
 */
static getOwnerGroomingServices = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: 'Usuario no autenticado' });
    }

    const owner = await Owner.findById(id);
    if (!owner) {
      return res.status(404).json({ msg: 'Dueño no encontrado' });
    }

    if (owner.veterinarian.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Acción no autorizada' });
    }

    const patients = await Patient.find({ owner: id }).select('_id name');
    const patientIds = patients.map(p => p._id);

    if (patientIds.length === 0) {
      return res.json({ services: [], totalCount: 0 });
    }

    const services = await GroomingService.find({
      patientId: { $in: patientIds }
    })
      .populate('patientId', 'name species photo')
      .sort({ date: -1 });

    return res.json({
      services,
      totalCount: services.length
    });

  } catch (error: any) {
    console.error('Error en getOwnerGroomingServices:', error);

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