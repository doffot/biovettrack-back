
import { Request, Response } from 'express';
import Appointment, { AppointmentStatus } from '../models/Appointment';
import Patient, { IPatient } from '../models/Patient';
import mongoose from 'mongoose';

export class AppointmentController {

  static createAppointment = async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { type, date, reason, observations } = req.body;

    try {
      
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      //   Validar formato del ID
      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ msg: 'ID de paciente inválido' });
      }

      // Verificar que el paciente existe
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ msg: 'Paciente no encontrado' });
      }

      //  VALIDAR QUE EL PACIENTE PERTENECE AL VETERINARIO ACTUAL
      if (patient.mainVet.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: 'No tienes permiso para gestionar este paciente' });
      }

     
      const newAppointment = new Appointment({
        patient: patientId,
        type,
        date: new Date(date),
        reason,
        observations: observations || undefined,
        status: 'Programada'
      });

      await newAppointment.save();

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

  /* ---------- OBTENER CITA POR ID ---------- */

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
  /* ---------- ACTUALIZAR ESTADO DE CITA ---------- */
  static updateAppointmentStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: 'ID de cita inválido' });
      }

      // Populate completo del paciente
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

      // Obtener citas del paciente ordenadas por fecha (más recientes primero)
      const appointments = await Appointment.find({ patient: patientId })
        .sort({ date: -1 }) // Ordenar por fecha descendente (más recientes primero)
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


  /* ---------- ELIMINAR CITA ---------- */
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
      const { date } = req.params; // formato: YYYY-MM-DD

      if (!req.user || !req.user._id) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      // Validar formato de fecha
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ msg: 'Formato de fecha inválido. Use YYYY-MM-DD' });
      }

      // Obtener IDs de pacientes del veterinario
      const patientIds = await Patient.find(
        { mainVet: req.user._id },
        '_id'
      ).distinct('_id');

      if (patientIds.length === 0) {
        return res.json({ appointments: [] });
      }

      // Calcular rango de fechas: desde 00:00 hasta 23:59 del día dado
      const startOfDay = new Date(dateObj);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(dateObj);
      endOfDay.setUTCHours(23, 59, 59, 999);

      // Obtener citas en ese rango
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

  /* ---------- ACTUALIZAR CITA COMPLETA ---------- */
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

    // Verificar que la cita existe y obtener el paciente para validar permisos
    const appointment = await Appointment.findById(id).populate<{ patient: IPatient }>('patient', 'mainVet');

    if (!appointment) {
      return res.status(404).json({ msg: 'Cita no encontrada' });
    }

    // Validar que patient esté poblado
    if (!appointment.patient || typeof appointment.patient === 'string') {
      return res.status(500).json({ msg: 'Error al cargar los datos del paciente' });
    }

    // Validar pertenencia al veterinario actual
    if (appointment.patient.mainVet.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'No tienes permiso para editar esta cita' });
    }

    // Validar campos obligatorios
    if (!type || !date || !reason) {
      return res.status(400).json({ msg: 'Faltan campos obligatorios' });
    }

    // Validar tipo de cita
    const validTypes = ['Consulta', 'Peluquería', 'Laboratorio', 'Vacuna', 'Cirugía', 'Tratamiento'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ msg: 'Tipo de cita no válido' });
    }

    // Validar fecha
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ msg: 'Formato de fecha inválido' });
    }

    // Validar motivo
    if (typeof reason !== 'string' || reason.trim().length < 2) {
      return res.status(400).json({ msg: 'El motivo debe tener al menos 2 caracteres' });
    }

    // Validar observaciones (opcional)
    if (observations !== undefined && (typeof observations !== 'string' || observations.length > 500)) {
      return res.status(400).json({ msg: 'Las observaciones no pueden exceder 500 caracteres' });
    }

    // ✅ ACTUALIZAR LA CITA
    appointment.type = type;
    appointment.date = dateObj;
    appointment.reason = reason.trim();
    appointment.observations = observations ? observations.trim() : undefined;

    await appointment.save();

    // Devolver la cita actualizada con paciente poblado
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