// server.ts
import './env'; 
import express from "express";
import { connectDB } from "./config/db";
import cors from "cors";
import ownerRoutes from "./routes/ownerRoutes";
import patientRoutes from "./routes/patientRoutes";
import labExamRoutes from "./routes/labExamRoutes";
import { corsConfig } from "./config/cors";
import authRoutes from "./routes/authRoutes";
import { globalGroomingRouter, patientGroomingRouter } from './routes/groomingRoutes';
// 👇 Importa tu nuevo router de citas
import patientAppointmentRouter, { globalAppointmentRouter } from './routes/appointmentRoutes';

connectDB();

const app = express();
app.use(cors(corsConfig));
app.use(express.json());

// Rutas principales
app.use('/api/owners', ownerRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/appointments', globalAppointmentRouter);

// Rutas anidadas: exámenes de laboratorio por paciente
app.use('/api/patients/:patientId/lab-exams', labExamRoutes);

// ✅ Rutas de peluquería
app.use('/api/grooming', globalGroomingRouter);
app.use('/api/patients/:patientId/grooming', patientGroomingRouter);

// ✅ Rutas de citas (igual que peluquería)
app.use('/api/patients/:patientId/appointments', patientAppointmentRouter);

export default app;
