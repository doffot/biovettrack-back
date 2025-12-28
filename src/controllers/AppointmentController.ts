// src/controllers/AppointmentController.ts
import { Request, Response } from 'express';
import Appointment, { AppointmentStatus } from '../models/Appointment';
import Patient, { IPatient } from '../models/Patient';
import mongoose from 'mongoose';
import Owner from '../models/Owner';

export class AppointmentController {

 static createAppointment = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { type, date, reason, observations, prepaidAmount } = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ msg: 'ID de paciente inválido' });
      }

      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ msg: 'Paciente no encontrado' });
      }

      if (patient.mainVet.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: 'No tienes permiso para gestionar este paciente' });
      }

      const newAppointment = new Appointment({
        patient: patientId,
        type,
        date: new Date(date),
        reason,
        observations: observations || undefined,
        prepaidAmount: prepaidAmount || 0,
        status: 'Programada'
      });

      await newAppointment.save();

      // Si hay prepago, agregar al crédito del Owner
      if (prepaidAmount && prepaidAmount > 0 && patient.owner) {
        await Owner.findByIdAndUpdate(
          patient.owner,
          { $inc: { creditBalance: prepaidAmount } }
        );
        console.log(`✅ Crédito de $${prepaidAmount} agregado al Owner ${patient.owner}`);
      }

      res.status(201).json({
        msg: 'Cita creada correctamente',
        appointment: newAppointment
      });

    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: 'Datos inválidos', errors: error.errors });
      }
      console.error('Error en createAppointment:', error);
      res.status(500).json({ msg: 'Error al crear la cita' });
    }
  };

  static getAppointmentById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: 'ID de cita inválido' });
      }

      const appointment = await Appointment.findById(id)
        .populate<{ patient: IPatient }>('patient', 'mainVet');

      if (!appointment) {
        return res.status(404).json({ msg: 'Cita no encontrada' });
      }

      if (appointment.patient.mainVet.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: 'No tienes permiso para ver esta cita' });
      }

      const fullAppointment = await Appointment.findById(id)
        .populate({
          path: 'patient',
          select: 'name species breed color identification photo birthDate owner mainVet',
          populate: [
            {
              path: 'owner',
              select: 'name lastName email contact address',
              model: 'Owner'
            },
            {
              path: 'mainVet', 
              select: 'name lastName specialty',
              model: 'Veterinarian'
            }
          ]
        });

      res.json({
        appointment: fullAppointment
      });

    } catch (error: any) {
      console.error('Error en getAppointmentById:', error);
      res.status(500).json({ msg: 'Error al obtener la cita' });
    }
  };

 static updateAppointmentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, shouldRefund } = req.body;

  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: 'Usuario no autenticado' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'ID de cita inválido' });
    }

    const appointment = await Appointment.findById(id).populate('patient');

    if (!appointment) {
      return res.status(404).json({ msg: 'Cita no encontrada' });
    }

    if (typeof appointment.patient === 'string') {
      return res.status(500).json({ msg: 'Paciente no cargado correctamente' });
    }

    const patient = appointment.patient as IPatient;
    
    if (patient.mainVet.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'No tienes permiso para esta cita' });
    }

    const validStatuses: AppointmentStatus[] = ['Programada', 'Completada', 'Cancelada', 'No asistió'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: 'Estado no válido' });
    }

    // Lógica de cancelación con prepago
    if (status === 'Cancelada' && appointment.prepaidAmount && appointment.prepaidAmount > 0) {
      const ownerId = patient.owner;
      
      if (ownerId) {
        if (shouldRefund === true) {
          // Reembolsar: quitar del creditBalance del owner
          await Owner.findByIdAndUpdate(
            ownerId,
            { $inc: { creditBalance: -appointment.prepaidAmount } }
          );
          console.log(`💸 Reembolso de $${appointment.prepaidAmount} al Owner ${ownerId}`);
        } else {
          // Mantener como crédito: no hacer nada, el crédito ya está en el owner
          console.log(`💰 Crédito de $${appointment.prepaidAmount} mantenido para Owner ${ownerId}`);
        }
      }
    }

    appointment.status = status;
    await appointment.save();

    res.json({
      msg: 'Estado actualizado',
      appointment
    });

  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ msg: 'Error al actualizar cita' });
  }
};

  static getAppointmentsByPatient = async (req: Request, res: Response) => {
    const { patientId } = req.params;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ msg: 'ID de paciente inválido' });
      }

      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ msg: 'Paciente no encontrado' });
      }

      if (patient.mainVet.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: 'No tienes permiso para ver este paciente' });
      }

      const appointments = await Appointment.find({ patient: patientId })
        .sort({ date: -1 })
        .lean();

      res.json(appointments);

    } catch (error: any) {
      console.error('Error en getAppointmentsByPatient:', error);
      res.status(500).json({ msg: 'Error al obtener citas' });
    }
  };

  static getAllAppointments = async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const patientIds = await Patient.find(
        { mainVet: req.user._id },
        '_id'
      ).distinct('_id');

      if (patientIds.length === 0) {
        return res.json({
          success: true,
          appointments: []
        });
      }

      const appointments = await Appointment.find({
        patient: { $in: patientIds }
      })
        .populate({
          path: 'patient',
          select: 'name species breed color identification photo birthDate owner mainVet',
          populate: [
            {
              path: 'owner',
              select: 'name lastName email contact address',
              model: 'Owner'
            },
            {
              path: 'mainVet', 
              select: 'name lastName specialty',
              model: 'Veterinarian'
            }
          ]
        })
        .sort({ date: 1 });

      const filteredAppointments = appointments.filter(apt => apt.patient !== null);

      res.json({
        success: true,
        appointments: filteredAppointments
      });

    } catch (error: any) {
      console.error('Error en getAllAppointments:', error);
      res.status(500).json({ 
        success: false,
        msg: 'Error al obtener las citas' 
      });
    }
  };

  static deleteAppointment = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: 'ID de cita inválido' });
      }

      const appointment = await Appointment.findById(id).populate<{ patient: IPatient }>('patient');

      if (!appointment) {
        return res.status(404).json({ msg: 'Cita no encontrada' });
      }

      if (!appointment.patient || typeof appointment.patient === 'string') {
        return res.status(500).json({ msg: 'Error al cargar los datos del paciente' });
      }

      if (appointment.patient.mainVet.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: 'No tienes permiso para eliminar esta cita' });
      }
    
      await Appointment.findByIdAndDelete(id);
  
      res.json({ msg: 'Cita eliminada correctamente' });

    } catch (error: any) {
      console.error('Error en deleteAppointment:', error);
      res.status(500).json({ msg: 'Error al eliminar la cita' });
    }
  };

  static getAppointmentsByDateForVeterinarian = async (req: Request, res: Response) => {
    try {
      const { date } = req.params;

      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ msg: 'Formato de fecha inválido. Use YYYY-MM-DD' });
      }

      const patientIds = await Patient.find(
        { mainVet: req.user._id },
        '_id'
      ).distinct('_id');

      if (patientIds.length === 0) {
        return res.json({ appointments: [] });
      }

      const startOfDay = new Date(dateObj);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(dateObj);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const appointments = await Appointment.find({
        patient: { $in: patientIds },
        date: { $gte: startOfDay, $lte: endOfDay }
      }).populate('patient', 'name').lean();

      res.json({ appointments });
    } catch (error: any) {
      console.error('Error en getAppointmentsByDateForVeterinarian:', error);
      res.status(500).json({ msg: 'Error al obtener las citas' });
    }
  };

  static updateAppointment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { type, date, reason, observations } = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: 'ID de cita inválido' });
      }

      const appointment = await Appointment.findById(id).populate<{ patient: IPatient }>('patient', 'mainVet');

      if (!appointment) {
        return res.status(404).json({ msg: 'Cita no encontrada' });
      }

      if (!appointment.patient || typeof appointment.patient === 'string') {
        return res.status(500).json({ msg: 'Error al cargar los datos del paciente' });
      }

      if (appointment.patient.mainVet.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: 'No tienes permiso para editar esta cita' });
      }

      if (!type || !date || !reason) {
        return res.status(400).json({ msg: 'Faltan campos obligatorios' });
      }

      const validTypes = ['Consulta', 'Peluquería', 'Laboratorio', 'Vacuna', 'Cirugía', 'Tratamiento'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ msg: 'Tipo de cita no válido' });
      }

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ msg: 'Formato de fecha inválido' });
      }

      if (typeof reason !== 'string' || reason.trim().length < 2) {
        return res.status(400).json({ msg: 'El motivo debe tener al menos 2 caracteres' });
      }

      if (observations !== undefined && (typeof observations !== 'string' || observations.length > 500)) {
        return res.status(400).json({ msg: 'Las observaciones no pueden exceder 500 caracteres' });
      }

      appointment.type = type;
      appointment.date = dateObj;
      appointment.reason = reason.trim();
      appointment.observations = observations ? observations.trim() : undefined;

      await appointment.save();

      const updatedAppointment = await Appointment.findById(appointment._id)
        .populate({
          path: 'patient',
          select: 'name species breed color identification photo birthDate owner mainVet',
          populate: [
            {
              path: 'owner',
              select: 'name lastName email contact address',
              model: 'Owner'
            },
            {
              path: 'mainVet', 
              select: 'name lastName specialty',
              model: 'Veterinarian'
            }
          ]
        });

      res.json({
        msg: 'Cita actualizada correctamente',
        appointment: updatedAppointment
      });

    } catch (error: any) {
      console.error('Error en updateAppointment:', error);
      res.status(500).json({ msg: 'Error al actualizar la cita' });
    }
  };

}