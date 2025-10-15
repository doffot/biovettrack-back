// server.ts
import './env'; 
import express from "express";
import { connectDB } from "./config/db";
import cors from "cors";
import ownerRoutes from "./routes/ownerRoutes";
import patientRoutes from "./routes/patientRoutes";
import labExamRoutes from "./routes/labExamRoutes";
import { corsConfig } from "./config/cors";
import { globalGroomingRouter, patientGroomingRouter } from './routes/groomingRoutes';

connectDB();

const app = express();
app.use(cors(corsConfig));
app.use(express.json());

// Rutas principales
app.use('/api/owners', ownerRoutes);
app.use('/api/patients', patientRoutes);

// Rutas anidadas: exámenes de laboratorio por paciente
app.use('/api/patients/:patientId/lab-exams', labExamRoutes);

// ✅ Rutas de peluquería: SEPARADAS para evitar conflictos
app.use('/api/grooming', globalGroomingRouter); // → Rutas globales (sin patientId)
app.use('/api/patients/:patientId/grooming', patientGroomingRouter); // → Rutas por paciente

export default app;