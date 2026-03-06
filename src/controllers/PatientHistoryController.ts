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
import Hematology from "../models/Hematology";
import Cytology from "../models/Cytology";
import SkinScraping from "../models/SkinScraping"; 
import Trichogram from "../models/Trichogram";     
import QuickTest from "../models/QuickTest";       
import Urinalysis from "../models/Urinalysis";     
import MedicalStudy from "../models/MedicalStudy";
import VeterinaryService from "../models/VeterinaryService";
import Patient from "../models/Patient";

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
      if (!patient) return res.status(404).json({ msg: "Paciente no encontrado" });

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

      const labExamIds = lab.map((l) => l._id);

      // =============================================
      // OBTENER DATOS ESPECÍFICOS DE TODOS LOS TIPOS
      // =============================================
      const [hematologies, cytologies, scrapings, trichograms, tests, urinalyses] = await Promise.all([
        Hematology.find({ labExamId: { $in: labExamIds } }).lean(),
        Cytology.find({ labExamId: { $in: labExamIds } }).lean(),
        SkinScraping.find({ labExamId: { $in: labExamIds } }).lean(),
        Trichogram.find({ labExamId: { $in: labExamIds } }).lean(),
        QuickTest.find({ labExamId: { $in: labExamIds } }).lean(),
        Urinalysis.find({ labExamId: { $in: labExamIds } }).lean(),
      ]);

      // Mapas para acceso rápido O(1)
      const hemaMap = new Map(hematologies.map(h => [h.labExamId.toString(), h]));
      const cytoMap = new Map(cytologies.map(c => [c.labExamId.toString(), c]));
      const scrapMap = new Map(scrapings.map(s => [s.labExamId.toString(), s]));
      const trichMap = new Map(trichograms.map(t => [t.labExamId.toString(), t]));
      const testMap = new Map(tests.map(t => [t.labExamId.toString(), t]));
      const uriMap = new Map(urinalyses.map(u => [u.labExamId.toString(), u]));

      // =============================================
      // MAPEAR EXÁMENES DE LABORATORIO DINÁMICAMENTE
      // =============================================
      const labExamEntries: HistoryEntry[] = lab.map((exam): HistoryEntry => {
        const examType = exam.examType;
        const base = {
          _id: String(exam._id),
          type: "labExam" as const,
          date: exam.date,
          status: "Completado",
          cost: exam.cost || 0,
          discount: exam.discount,
        };

        switch (examType) {
          case "hematology":
            const h = hemaMap.get(exam._id.toString());
            return { 
              ...base, 
              title: "Lab - Hemograma", 
              description: `HTO: ${h?.hematocrit || '--'}% - GB: ${h?.whiteBloodCells || '--'}`,
              observations: h?.observacion, 
              details: h?.hemotropico ? `Hemotrópico: ${h.hemotropico}` : undefined 
            };

          case "cytology":
            const c = cytoMap.get(exam._id.toString());
            return { 
              ...base, 
              title: "Lab - Citología", 
              description: `Muestra: ${c?.sampleType || 'No especificada'}`,
              observations: c?.results, 
              details: `Coloración: ${c?.coloration}` 
            };

          case "skin_scraping":
            const s = scrapMap.get(exam._id.toString());
            return { 
              ...base, 
              title: "Lab - Raspado Cutáneo", 
              description: `Tipo: ${s?.type || 'N/A'}`, 
              observations: s?.results 
            };

          case "trichogram":
            const t = trichMap.get(exam._id.toString());
            return { 
              ...base, 
              title: "Lab - Tricograma", 
              description: "Análisis de vello/pelo", 
              observations: t?.results 
            };

          case "quick_test":
            const qt = testMap.get(exam._id.toString());
            return { 
              ...base, 
              title: `Lab - Test: ${qt?.testName || 'Rápido'}`, 
              description: `Resultado: ${qt?.results || 'Pendiente'}` 
            };

          case "urinalysis":
            const u = uriMap.get(exam._id.toString());
            return { 
              ...base, 
              title: "Lab - Uroanálisis", 
              description: `Densidad: ${u?.specificGravity || '--'} - pH: ${u?.pH || '--'}`,
              details: `Aspecto: ${u?.appearance || '--'} - Color: ${u?.color || '--'}${u?.collectionMethod ? ` - Método: ${u.collectionMethod}` : ''}`,
              observations: u?.otherFindings || (u?.bacteria ? `Bacterias: ${u.bacteria}` : undefined)
            };

          default:
            return { 
              ...base, 
              title: `Lab - ${examType}`, 
              description: "Examen de laboratorio" 
            };
        }
      });

      // =============================================
      // CONSTRUIR EL HISTORIAL FINAL
      // =============================================
      const history: HistoryEntry[] = [
        ...app.map(i => ({ 
          _id: String(i._id), 
          type: "appointment" as const, 
          date: i.date, 
          title: `Cita - ${i.type}`, 
          description: i.reason, 
          observations: i.observations, 
          status: i.status, 
          cost: i.prepaidAmount || 0 
        })),
        ...cons.map(i => ({ 
          _id: String(i._id), 
          type: "consultation" as const, 
          date: i.consultationDate, 
          title: "Consulta Médica", 
          description: i.reasonForVisit || "Chequeo general", 
          observations: i.treatmentPlan, 
          details: i.presumptiveDiagnosis ? `Dx: ${i.presumptiveDiagnosis}` : undefined, 
          status: i.isDraft ? "Borrador" : "Completada", 
          cost: i.cost || 0, 
          discount: i.discount 
        })),
        ...dew.map(i => ({ 
          _id: String(i._id), 
          type: "deworming" as const, 
          date: i.applicationDate, 
          title: `Desparasitación ${i.dewormingType}`, 
          description: `${i.productName} - Dosis: ${i.dose}`, 
          status: "Aplicada", 
          cost: i.cost || 0, 
          nextDate: i.nextApplicationDate 
        })),
        ...gro.map(i => ({ 
          _id: String(i._id), 
          type: "grooming" as const, 
          date: i.date, 
          title: `Peluquería - ${i.service}`, 
          description: i.specifications, 
          observations: i.observations, 
          status: "Completado", 
          cost: i.cost || 0 
        })),
        ...vac.map(i => ({ 
          _id: String(i._id), 
          type: "vaccination" as const, 
          date: i.vaccinationDate, 
          title: `Vacuna - ${i.vaccineType}`, 
          description: i.laboratory || i.vaccineType, 
          status: i.source === 'external' ? 'Externa' : 'Aplicada', 
          cost: i.cost || 0, 
          nextDate: i.nextVaccinationDate 
        })),
        ...rec.map(i => ({ 
          _id: String(i._id), 
          type: "recipe" as const, 
          date: i.issueDate, 
          title: "Receta Médica", 
          description: i.medications?.map((m: any) => m.name).join(', ') || "Prescripción", 
          observations: i.notes, 
          status: "Emitida", 
          cost: 0 
        })),
        ...treat.map(i => ({ 
          _id: String(i._id), 
          type: "treatment" as const, 
          date: i.startDate, 
          title: `Tratamiento - ${i.treatmentType}`, 
          description: i.productName, 
          observations: i.observations, 
          status: i.status, 
          cost: i.cost || 0, 
          nextDate: i.endDate 
        })),
        ...labExamEntries,
        ...study.map(i => ({ 
          _id: String(i._id), 
          type: "medicalStudy" as const, 
          date: i.date, 
          title: `Estudio - ${i.studyType}`, 
          description: `Realizado por: ${i.professional}`, 
          observations: i.notes, 
          status: "Completado", 
          cost: 0 
        })),
        ...vetServ.map(i => ({ 
          _id: String(i._id), 
          type: "veterinaryService" as const, 
          date: i.serviceDate, 
          title: `Servicio - ${i.serviceName}`, 
          description: i.description || i.serviceName, 
          observations: i.notes, 
          status: i.status, 
          cost: i.totalCost || 0, 
          discount: i.discount 
        })),
      ];

      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.json(history);

    } catch (error) {
      console.error("Error en el historial:", error);
      res.status(500).json({ msg: "Error al generar el historial" });
    }
  };
}