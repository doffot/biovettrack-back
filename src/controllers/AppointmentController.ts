// src/controllers/AppointmentController.ts
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

      // ✅ Paso 2: Validar formato del ID
      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ msg: 'ID de paciente inválido' });
      }

      // ✅ Paso 3: Verificar que el paciente existe
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ msg: 'Paciente no encontrado' });
      }

      // 🔒 Paso 4: VALIDAR QUE EL PACIENTE PERTENECE AL VETERINARIO ACTUAL
      if (patient.mainVet.toString() !== req.user._id.toString()) {
        return res.status(403).json({ msg: 'No tienes permiso para gestionar este paciente' });
      }

      // ✅ Paso 5: Crear la cita
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

    // ✅ Populate completo del paciente
    const appointment = await Appointment.findById(id).populate('patient');

    if (!appointment) {
      return res.status(404).json({ msg: 'Cita no encontrada' });
    }

    // ✅ Verificar que patient esté poblado (no sea ObjectId)
    if (typeof appointment.patient === 'string') {
      return res.status(500).json({ msg: 'Paciente no cargado correctamente' });
    }

    // ✅ Castear a IPatient para acceder a mainVet
    const patient = appointment.patient as IPatient;

    // ✅ Validar pertenencia
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

    // Verificar que el paciente existe y pertenece al veterinario
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

// src/controllers/AppointmentController.ts
static getAllAppointments = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: 'Usuario no autenticado' });
    }

    // 🔥 POPULATE CORREGIDO - un solo populate con array
    const appointments = await Appointment.find()
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
      .sort({ date: 1 }); // ✅ Agregar ordenamiento

    // Filtrar citas que tienen paciente
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

}