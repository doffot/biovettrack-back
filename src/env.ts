// src/env.ts
import dotenv from 'dotenv';
import path from 'path';

// Asegúrate de cargar .env ANTES de cualquier otro módulo
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verifica que las variables estén cargadas
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  throw new Error('❌ Falta CLOUDINARY_CLOUD_NAME en .env');
}
if (!process.env.CLOUDINARY_API_KEY) {
  throw new Error('❌ Falta CLOUDINARY_API_KEY en .env');
}
if (!process.env.CLOUDINARY_API_SECRET) {
  throw new Error('❌ Falta CLOUDINARY_API_SECRET en .env');
}

console.log('✅ Variables de entorno cargadas correctamente');