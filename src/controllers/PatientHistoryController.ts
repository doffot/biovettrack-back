// src/controllers/PatientHistoryController.ts
import type { Request, Response } from "express";
import Appointment from "../models/Appointment";
import Consultation from "../models/Consultation";
import Deworming from "../models/Deworming";
import GroomingService from "../models/GroomingService";
import Recipe from "../models/Recipe";
import Vaccination from "../models/Vaccination";
import Treatment from "../models/Treatment";
import LabExam from "../models/LabExam";
import MedicalStudy from "../models/MedicalStudy";
import VeterinaryService from "../models/VeterinaryService";
import Patient from "../models/Patient";

// INTERFAZ TIPADA ✅
interface HistoryEntry {
  _id: string;
  type: 'appointment' | 'consultation' | 'deworming' | 'grooming' | 'vaccination' | 
        'recipe' | 'treatment' | 'labExam' | 'medicalStudy' | 'veterinaryService';
  date: Date;
  title: string;
  description: string;
  observations?: string;
  status?: string;
  cost: number;
  discount?: number;
  nextDate?: Date;
  details?: string;
}

export class PatientHistoryController {
  static getFullHistory = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;

      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ msg: "Paciente no encontrado" });
      }

      const [app, cons, dew, gro, vac, rec, treat, lab, study, vetServ] = await Promise.all([
        Appointment.find({ patient: patientId }).lean(),
        Consultation.find({ patientId }).lean(),
        Deworming.find({ patientId }).lean(),
        GroomingService.find({ patientId }).lean(),
        Vaccination.find({ patientId }).lean(),
        Recipe.find({ patientId }).lean(),
        Treatment.find({ patientId }).lean(),
        LabExam.find({ patientId }).lean(),
        MedicalStudy.find({ patientId }).lean(),
        VeterinaryService.find({ patientId }).lean(),
      ]);

      const history: HistoryEntry[] = [
        // CITAS
        ...app.map((i): HistoryEntry => ({
          _id: String(i._id),
          type: "appointment",
          date: i.date,
          title: `Cita - ${i.type}`,
          description: i.reason,
          observations: i.observations,
          status: i.status,
          cost: i.prepaidAmount || 0,
        })),

        // CONSULTAS
        ...cons.map((i): HistoryEntry => ({
          _id: String(i._id),
          type: "consultation",
          date: i.consultationDate,
          title: "Consulta Médica",
          description: i.reasonForVisit || "Chequeo general",
          observations: i.treatmentPlan,
          details: i.presumptiveDiagnosis 
            ? `Diagnóstico: ${i.presumptiveDiagnosis}` 
            : undefined,
          status: i.isDraft ? "Borrador" : "Completada",
          cost: i.cost || 0,
          discount: i.discount,
        })),

        // DESPARASITACIONES
        ...dew.map((i): HistoryEntry => ({
          _id: String(i._id),
          type: "deworming",
          date: i.applicationDate,
          title: `Desparasitación ${i.dewormingType}`,
          description: `${i.productName} - Dosis: ${i.dose}`,
          observations: i.source === 'Externo' 
            ? 'Aplicada fuera de la clínica' 
            : undefined,
          status: "Aplicada",
          cost: i.cost || 0,
          nextDate: i.nextApplicationDate,
          details: i.nextApplicationDate 
            ? `Próxima aplicación: ${new Date(i.nextApplicationDate).toLocaleDateString()}` 
            : undefined,
        })),

        // ESTÉTICA/PELUQUERÍA
        ...gro.map((i): HistoryEntry => ({
          _id: String(i._id),
          type: "grooming",
          date: i.date,
          title: `Peluquería - ${i.service}`,
          description: i.specifications,
          observations: i.observations,
          status: "Completado",
          cost: i.cost || 0,
        })),

        // VACUNAS
        ...vac.map((i): HistoryEntry => ({
          _id: String(i._id),
          type: "vaccination",
          date: i.vaccinationDate,
          title: `Vacuna - ${i.vaccineType}`,
          description: i.laboratory 
            ? `Laboratorio: ${i.laboratory}${i.batchNumber ? ` - Lote: ${i.batchNumber}` : ''}` 
            : i.vaccineType,
          observations: i.observations,
          status: i.source === 'external' ? 'Aplicada externamente' : 'Aplicada',
          cost: i.cost || 0,
          nextDate: i.nextVaccinationDate,
          details: i.nextVaccinationDate 
            ? `Próxima dosis: ${new Date(i.nextVaccinationDate).toLocaleDateString()}` 
            : undefined,
        })),

        // RECETAS
        ...rec.map((i): HistoryEntry => ({
          _id: String(i._id),
          type: "recipe",
          date: i.issueDate,
          title: "Receta Médica",
          description: i.medications && i.medications.length > 0
            ? i.medications.map((m: any) => m.name).join(', ')
            : "Prescripción médica",
          observations: i.notes,
          status: "Emitida",
          cost: 0,
          details: `${i.medications?.length || 0} medicamento(s) prescritos`,
        })),

        // TRATAMIENTOS
        ...treat.map((i): HistoryEntry => ({
          _id: String(i._id),
          type: "treatment",
          date: i.startDate,
          title: `Tratamiento - ${i.treatmentType === 'Otro' ? i.treatmentTypeOther : i.treatmentType}`,
          description: `${i.productName} - ${i.dose} cada ${i.frequency}`,
          observations: i.observations,
          status: i.status,
          cost: i.cost || 0,
          nextDate: i.endDate,
          details: `Vía: ${i.route === 'Otro' ? i.routeOther : i.route} - Duración: ${i.duration}`,
        })),

        // EXÁMENES DE LABORATORIO
        ...lab.map((i): HistoryEntry => ({
          _id: String(i._id),
          type: "labExam",
          date: i.date,
          title: "Examen de Laboratorio - Hemograma",
          description: `Hematocrito: ${i.hematocrit}% - GB: ${i.whiteBloodCells}`,
          observations: i.observacion,
          status: "Completado",
          cost: i.cost || 0,
          discount: i.discount,
          details: i.hemotropico 
            ? `Hemotrópico: ${i.hemotropico}` 
            : `Proteínas totales: ${i.totalProtein}`,
        })),

        // ESTUDIOS MÉDICOS
        ...study.map((i): HistoryEntry => ({
          _id: String(i._id),
          type: "medicalStudy",
          date: i.date,
          title: `Estudio - ${i.studyType}`,
          description: `Realizado por: ${i.professional}`,
          observations: i.notes,
          status: "Completado",
          cost: 0,
          details: i.presumptiveDiagnosis 
            ? `Diagnóstico presuntivo: ${i.presumptiveDiagnosis}` 
            : undefined,
        })),

        // SERVICIOS VETERINARIOS
        ...vetServ.map((i): HistoryEntry => ({
          _id: String(i._id),
          type: "veterinaryService",
          date: i.serviceDate,
          title: `Servicio - ${i.serviceName}`,
          description: i.description || i.serviceName,
          observations: i.notes,
          status: i.status,
          cost: i.totalCost || 0,
          discount: i.discount,
          details: i.products && i.products.length > 0
            ? `${i.products.length} producto(s) utilizados`
            : `Honorarios: $${i.veterinarianFee}`,
        })),
      ];

      // Ordenar: lo más nuevo arriba
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.json(history);

    } catch (error) {
      console.error("Error en el historial:", error);
      res.status(500).json({ msg: "Error al generar el historial" });
    }
  };
}