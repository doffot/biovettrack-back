// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// dotenv.config();


// const config = () =>{
//     return{
//  host: process.env.SMTP_HOST,

//   port:+process.env.SMTP_PORT ,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   }
//     }
// }


// export const transport = nodemailer.createTransport(config())

// src/config/nodemailer.ts
import nodemailer from 'nodemailer';

export const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true para puerto 465, false para 587
  auth: {
    user: process.env.EMAIL_USER, // biovettrack@gmail.com
    pass: process.env.EMAIL_PASS, // tu contraseña de app
  },
  // Opcional: para evitar errores en algunos entornos
  tls: {
    rejectUnauthorized: false
  }
});