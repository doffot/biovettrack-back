// src/services/LabExamService.ts
import mongoose, { Types, ClientSession } from "mongoose";
import LabExam from "../models/LabExam";
import Hematology from "../models/Hematology";
import Cytology from "../models/Cytology";
import SkinScraping from "../models/SkinScraping";
import Trichogram from "../models/Trichogram";
import QuickTest from "../models/QuickTest";
import Urinalysis from "../models/Urinalysis";
import Invoice from "../models/Invoice";
import Patient from "../models/Patient";
import Appointment from "../models/Appointment";
import Product from "../models/Product";
import Inventory from "../models/Inventory";
import InventoryMovement from "../models/InventoryMovement";
import { validateDifferentialSum } from "../utils/validateDifferentialCount";

// =============================================
// CONFIGURACIÓN POR TIPO DE EXAMEN
// =============================================
const EXAM_CONFIG: Record<string, { model: any; fields: string[]; name: string }> = {
  hematology: {
    model: Hematology,
    fields: [
      "hematocrit", 
      "whiteBloodCells", 
      "totalProtein", 
      "platelets", 
      "differentialCount", 
      "totalCells", 
      "hemotropico", 
      "observacion"
    ],
    name: "Hemograma",
  },
  cytology: {
    model: Cytology,
    fields: ["sampleType", "coloration", "results"],
    name: "Citología",
  },
   skin_scraping: {
    model: SkinScraping,
    fields: ["type", "results"],
    name: "Raspado Cutáneo",
  },
  trichogram: {
    model: Trichogram,
    fields: ["results"],
    name: "Tricograma",
  },
  test: {
    model: QuickTest,
    fields: ["testName", "results", "source", "productId", "quantity"],
    name: "Test Rápido",
  },
  urinalysis: {
    model: Urinalysis,
    fields: [
      "collectionMethod",
      "color",
      "appearance",
      "specificGravity",
      "pH",
      "proteins",
      "glucose",
      "ketones",
      "bilirubin",
      "blood",
      "urobilinogen",
      "nitrites",
      "leukocytesChemical",
      "epithelialCells",
      "sedimentLeukocytes",
      "sedimentErythrocytes",
      "bacteria",
      "crystals",
      "casts",
      "otherFindings",
    ],
    name: "Uroanálisis",
  },
};

// =============================================
// FUNCIONES AUXILIARES
// =============================================
const getAllSpecificFields = (): string[] => {
  return Object.values(EXAM_CONFIG).flatMap((config) => config.fields);
};

const separateData = (data: any, examType: string) => {
  const config = EXAM_CONFIG[examType];
  const specificFields = config?.fields || [];
  const allSpecificFields = getAllSpecificFields();

  const specificData: any = {};
  const labExamData: any = {};

  Object.keys(data).forEach((key) => {
    if (specificFields.includes(key)) {
      specificData[key] = data[key];
    } else if (!allSpecificFields.includes(key)) {
      labExamData[key] = data[key];
    }
  });

  return { labExamData, specificData };
};

const combineExamData = (labExam: any, specificData: any) => {
  const examObj = labExam?.toObject ? labExam.toObject() : labExam;
  if (!examObj) return {};
  
  const specObj = specificData?.toObject ? specificData.toObject() : specificData;
  if (!specObj) return examObj;
  
  const { _id, labExamId, createdAt, updatedAt, __v, ...specFields } = specObj;
  return { ...examObj, ...specFields };
};

const validateSpecificFields = (data: any, examType: string): string | null => {
  switch (examType) {
    case "hematology":
      const hemFields = ["hematocrit", "whiteBloodCells", "totalProtein", "platelets", "totalCells"];
      for (const f of hemFields) {
        if (data[f] === undefined || data[f] === null) {
          return `El campo ${f} es obligatorio`;
        }
      }
      if (!data.differentialCount) return "Conteo diferencial es obligatorio";
      if (!validateDifferentialSum(data.differentialCount)) {
        return "La suma del diferencial no puede superar 100";
      }
      break;

    case "cytology":
      if (!data.sampleType?.trim()) return "Tipo de muestra es obligatorio";
      if (!data.coloration?.trim()) return "Coloración es obligatoria";
      if (!data.results?.trim()) return "Resultados son obligatorios";
      break;

    case "skin_scraping":  
      if (!data.type) return "Tipo de raspado (superficial/profunda) es obligatorio";
      if (!data.results?.trim()) return "Resultados son obligatorios";
      break;

    case "trichogram":
      if (!data.results?.trim()) return "Resultados son obligatorios";
      break;

    case "test":
      if (!data.testName?.trim()) return "Nombre del test es obligatorio";
      if (!data.results?.trim()) return "Resultado del test es obligatorio";
      if (data.source === "Interno" && !data.productId) {
        return "Debe seleccionar un producto del inventario para test interno";
      }
      break;

    case "urinalysis":
      if (!data.color?.trim()) return "El color es obligatorio";
      if (!data.appearance?.trim()) return "El aspecto es obligatorio";
      break;
  }
  return null;
};

// =============================================
// SERVICIO PRINCIPAL
// =============================================
export class LabExamService {
  
  // ═══════════════════════════════════════════════════════════
  // CREAR EXAMEN
  // ═══════════════════════════════════════════════════════════
  static async create(data: any, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const examType = data.examType || "hematology";
      const config = EXAM_CONFIG[examType];
      if (!config) throw new Error(`Tipo de examen no soportado: ${examType}`);

      const validationError = validateSpecificFields(data, examType);
      if (validationError) throw new Error(validationError);

      const { labExamData, specificData } = separateData(data, examType);

      // ═══════════════════════════════════════════════════════════
      // VALIDACIÓN DE STOCK (Solo para Test Interno)
      // ═══════════════════════════════════════════════════════════
      let productInfo: { name: string; price: number } | null = null;
      
      if (examType === "test" && data.source === "Interno" && data.productId) {
        productInfo = await LabExamService.validateStock(data, userId, session);
      }

      // Calcular costo final
      let finalCost = labExamData.cost || 0;
      if (examType === "test") {
        if (data.source === "Externo") {
          finalCost = 0;
        } else if (productInfo) {
          const quantity = data.quantity || 1;
          finalCost = productInfo.price * quantity;
          if (data.cost !== undefined && data.cost > 0) {
            finalCost = data.cost;
          }
        }
      }

      // 1. Crear LabExam base
      const [labExam] = await LabExam.create(
        [{ 
          ...labExamData, 
          vetId: userId, 
          examType,
          cost: finalCost,
        }], 
        { session }
      );

      // 2. Crear datos específicos
      const [specific] = await config.model.create(
        [{ ...specificData, labExamId: labExam._id }], 
        { session }
      );

      // ═══════════════════════════════════════════════════════════
      // CONSUMIR STOCK (Solo para Test Interno)
      // ═══════════════════════════════════════════════════════════
      if (examType === "test" && data.source === "Interno" && data.productId) {
        await LabExamService.consumeStock(data, userId, labExam._id as Types.ObjectId, session);
      }

      // 3. Completar cita si existe
      if (labExam.patientId) {
        await Appointment.findOneAndUpdate(
          { patient: labExam.patientId, type: "Laboratorio", status: "Programada" },
          { status: "Completada" },
          { session, sort: { date: 1 } }
        ).catch(err => console.error("Error Cita:", err));
      }

      // 4. Crear factura (solo si aplica)
      const shouldInvoice = LabExamService.shouldCreateInvoice(examType, data, finalCost);
      if (shouldInvoice) {
        await LabExamService.createInvoice(labExam, data, userId, config.name, session);
      }

      await session.commitTransaction();
      return combineExamData(labExam, specific);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // VALIDAR STOCK
  // ═══════════════════════════════════════════════════════════
  private static async validateStock(
    data: any, 
    userId: string, 
    session: ClientSession
  ): Promise<{ name: string; price: number }> {
    const product = await Product.findOne({
      _id: data.productId,
      veterinarian: userId
    }).session(session);

    if (!product) {
      throw new Error("Producto no encontrado o no autorizado");
    }

    const inventory = await Inventory.findOne({
      product: data.productId,
      veterinarian: userId
    }).session(session);

    if (!inventory) {
      throw new Error("El producto no tiene stock registrado");
    }

    const quantity = data.quantity || 1;

    if (inventory.stockUnits < quantity) {
      throw new Error(
        `Stock insuficiente. Solo hay ${inventory.stockUnits} ${product.unit || "unidad"}(es) disponibles`
      );
    }

    return {
      name: product.name,
      price: product.salePrice || 0,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CONSUMIR STOCK
  // ═══════════════════════════════════════════════════════════
  private static async consumeStock(
    data: any, 
    userId: string, 
    labExamId: Types.ObjectId,
    session: ClientSession
  ): Promise<void> {
    const inventory = await Inventory.findOne({
      product: data.productId,
      veterinarian: userId
    }).session(session);

    if (!inventory) {
      throw new Error("Inventario no encontrado");
    }

    const quantity = data.quantity || 1;
    const newStockUnits = inventory.stockUnits - quantity;

    inventory.stockUnits = newStockUnits;
    inventory.lastMovement = new Date();
    await inventory.save({ session });

    await InventoryMovement.create([{
      product: data.productId,
      type: "salida",
      reason: "uso_clinico",
      quantityUnits: quantity,
      quantityDoses: 0,
      stockAfterUnits: newStockUnits,
      stockAfterDoses: inventory.stockDoses || 0,
      referenceType: "LabExam",
      referenceId: labExamId,
      createdBy: userId,
    }], { session });
  }

  // ═══════════════════════════════════════════════════════════
  // DETERMINAR SI CREAR FACTURA
  // ═══════════════════════════════════════════════════════════
  private static shouldCreateInvoice(examType: string, data: any, cost: number): boolean {
    if (examType === "test" && data.source === "Externo") {
      return false;
    }
    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // CREAR FACTURA
  // ═══════════════════════════════════════════════════════════
  private static async createInvoice(
    labExam: any, 
    data: any, 
    userId: string, 
    examName: string, 
    session: ClientSession
  ) {
    const finalTotal = Math.max(0, labExam.cost - (labExam.discount || 0));
    const isFree = finalTotal === 0;
    
    let invoiceData: any = {
      items: [
        { 
          type: "labExam", 
          resourceId: labExam._id, 
          description: `${examName} - ${labExam.patientName}`, 
          cost: finalTotal, 
          quantity: 1 
        }
      ],
      currency: "USD", 
      total: finalTotal, 
      date: new Date(), 
      veterinarianId: userId,
    };

    if (!labExam.patientId) {
      const exchangeRate = data.exchangeRate || 1;
      const pAmount = data.paymentAmount || 0;
      const pCurr = data.paymentCurrency || "USD";
      
      let paidUSD = pCurr === "Bs" ? 0 : pAmount;
      let paidBs = pCurr === "Bs" ? pAmount : 0;
      paidUSD += (data.creditAmountUsed || 0);

      invoiceData = { 
        ...invoiceData, 
        exchangeRate, 
        amountPaidUSD: isFree ? 0 : parseFloat(paidUSD.toFixed(2)),
        amountPaidBs: isFree ? 0 : parseFloat(paidBs.toFixed(2)),
        paymentStatus: isFree ? "Pagado" : undefined,
        ownerName: labExam.ownerName, 
        ownerPhone: labExam.ownerPhone,
        paymentMethod: data.paymentMethodId, 
        paymentReference: data.paymentReference
      };
    } else {
      invoiceData.amountPaidUSD = 0; 
      invoiceData.amountPaidBs = 0;
      invoiceData.paymentStatus = isFree ? "Pagado" : "Pendiente";
      const patient = await Patient.findById(labExam.patientId).session(session);
      if (patient) { 
        invoiceData.ownerId = patient.owner; 
        invoiceData.patientId = labExam.patientId; 
      }
    }
    
    await Invoice.create([invoiceData], { session });
  }

  // ═══════════════════════════════════════════════════════════
  // OBTENER TODOS
  // ═══════════════════════════════════════════════════════════
  static async getAll(userId: string, examType?: string) {
    const filter: any = { vetId: userId };
    if (examType) filter.examType = examType;
    const exams = await LabExam.find(filter).sort({ createdAt: -1 });
    return LabExamService.combineMultiple(exams);
  }

  // ═══════════════════════════════════════════════════════════
  // OBTENER POR ID
  // ═══════════════════════════════════════════════════════════
  static async getById(id: string, userId: string) {
    const exam = await LabExam.findOne({ _id: id, vetId: userId });
    if (!exam) return null;
    const config = EXAM_CONFIG[exam.examType];
    const specific = config ? await config.model.findOne({ labExamId: id }) : null;
    return combineExamData(exam, specific);
  }

  // ═══════════════════════════════════════════════════════════
  // ACTUALIZAR
  // ═══════════════════════════════════════════════════════════
  static async update(id: string, data: any, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const existing = await LabExam.findOne({ _id: id, vetId: userId });
      if (!existing) throw new Error("Examen no encontrado");

      const { labExamData, specificData } = separateData(data, existing.examType);
      const updatedExam = await LabExam.findByIdAndUpdate(
        id, 
        labExamData, 
        { new: true, session }
      );
      
      const config = EXAM_CONFIG[existing.examType];
      let updatedSpec = null;
      if (config && Object.keys(specificData).length > 0) {
        updatedSpec = await config.model.findOneAndUpdate(
          { labExamId: id }, 
          specificData, 
          { new: true, session }
        );
      }

      await session.commitTransaction();
      return combineExamData(updatedExam, updatedSpec);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ELIMINAR
  // ═══════════════════════════════════════════════════════════
  static async delete(id: string, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const exam = await LabExam.findOne({ _id: id, vetId: userId });
      if (!exam) throw new Error("Examen no encontrado");
      
      const config = EXAM_CONFIG[exam.examType];
      if (config) {
        await config.model.deleteOne({ labExamId: id }, { session });
      }
      
      await LabExam.findByIdAndDelete(id, { session });
      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // OBTENER POR PACIENTE
  // ═══════════════════════════════════════════════════════════
  static async getByPatient(patientId: string, userId: string, examType?: string) {
    const filter: any = { patientId, vetId: userId };
    if (examType) filter.examType = examType;
    const exams = await LabExam.find(filter).sort({ date: -1 });
    return LabExamService.combineMultiple(exams);
  }

  // ═══════════════════════════════════════════════════════════
  // COMBINAR MÚLTIPLES
  // ═══════════════════════════════════════════════════════════
  private static async combineMultiple(exams: any[]) {
    if (exams.length === 0) return [];
    
    const examIds = exams.map((e) => e._id);
    const specificDataMap = new Map<string, any>();

    for (const config of Object.values(EXAM_CONFIG)) {
      const docs = await config.model.find({ labExamId: { $in: examIds } });
      docs.forEach((d: any) => specificDataMap.set(d.labExamId.toString(), d));
    }
    
    return exams.map((exam) => combineExamData(exam, specificDataMap.get(exam._id.toString())));
  }
}