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
import patientAppointmentRouter, { globalAppointmentRouter } from './routes/appointmentRoutes';
import paymentMethodRoutes from './routes/paymentMethodRoutes';
import staffRouter from './routes/staffRoutes';
import invoiceRouter from './routes/invoiceRoutes';
import medicalStudyRouter from './routes/medicalStudyRoutes';
import vaccinationRouter from './routes/vaccinationRoutes';
import dewormingRouter from './routes/dewormingRoutes';
import consultationRouter from './routes/consultationRoutes';
import recipeRouter from './routes/recipeRoutes'; // 👈 NUEVO
import paymentRoutes from './routes/paymentRoutes';
import productRoutes from './routes/productRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import saleRoutes from './routes/saleRoutes';

connectDB();

const app = express();
app.use(cors(corsConfig));
app.use(express.json());

// Rutas principales
app.use('/api/owners', ownerRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/appointments', globalAppointmentRouter);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use("/api/staff", staffRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/medical-studies", medicalStudyRouter);
app.use("/api/vaccinations", vaccinationRouter);
app.use("/api/dewormings", dewormingRouter);
app.use("/api/consultations", consultationRouter);
app.use("/api/recipes", recipeRouter); 
app.use("/api/payments", paymentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);

app.use('/api/lab-exams', labExamRoutes);
app.use('/api/patients/:patientId/lab-exams', labExamRoutes);

// Rutas de peluquería
app.use('/api/grooming', globalGroomingRouter);
app.use('/api/patients/:patientId/grooming', patientGroomingRouter);

// Rutas de citas
app.use('/api/patients/:patientId/appointments', patientAppointmentRouter);

export default app;