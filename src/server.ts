import './env'; 
import express from "express";
// import dotenv from "dotenv";
import { connectDB } from "./config/db";
import cors from "cors";
import ownerRoutes from "./routes/ownerRoutes";       // ✅ Nuevo
import patientRoutes from "./routes/patientRoutes";   // ✅ Corregido: typo
import labExamRoutes from "./routes/labExamRoutes";
import { corsConfig } from "./config/cors";

// Cargar variables de entorno
// dotenv.config();

console.log('🔍 Variables de entorno:');
console.log('CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('API_SECRET:', !!process.env.CLOUDINARY_API_SECRET); // Solo para no exponerla


// Conectar a la base de datos
connectDB();

// Inicializar Express
const app = express();
app.use(cors(corsConfig))

// Middleware para parsear JSON
app.use(express.json());

// Rutas
app.use('/api/owners', ownerRoutes); // ✅ Dueños
app.use('/api/patients', patientRoutes); // ✅ Pacientes
app.use('/api/patients/:patientId/lab-exams', labExamRoutes); // ✅ Exámenes anidados

// ✅ Nueva: rutas anidadas
app.use('/api/owners', patientRoutes);

export default app;