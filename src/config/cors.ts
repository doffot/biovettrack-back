// import { CorsOptions } from "cors";

// export const corsConfig: CorsOptions = {
//   origin: (origin, callback) => {
//     const whitelist = [process.env.FRONTEND_URL];

//     if (process.argv[2] === "--api") {
//       whitelist.push(undefined, null); // Permitir solicitudes sin origen (Postman, etc.)
//     }

//     if (!origin || whitelist.includes(origin)) {
//       callback(null, true); // Permitir acceso
//     } else {
//       callback(new Error("Error de CORS: origen no permitido")); // Bloquear acceso
//     }
//   },
// };
// src/config/cors.ts
import { CorsOptions } from "cors";

// Lista explícita de orígenes permitidos
const allowedOrigins = [
  "http://localhost:5173", // Desarrollo local
  "https://biovettrack-front-qren.vercel.app", // Producción en Vercel
];

export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir solicitudes sin origen (como Postman, curl, o algunos tests)
    if (!origin) {
      return callback(null, true);
    }

    // Verificar si el origen está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS bloqueado: ${origin} no está permitido.`);
      callback(new Error("Origen no permitido por CORS"), false);
    }
  },
  credentials: true, // Si usas cookies o autenticación con credenciales
};