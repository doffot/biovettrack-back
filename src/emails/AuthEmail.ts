// src/services/AuthEmail.ts
import { transport } from "../config/nodemailer"

interface Iemail {
    email: string;
    name: string;
    token: string;
}

export class AuthEmail {
    static sendConfirmationEmail = async (veterinarian: Iemail) => {
        await transport.sendMail({
            from: `BioVetTrack <${process.env.EMAIL_USER}>`, // ✅ Usa tu Gmail
            to: veterinarian.email,
            subject: 'BioVetTrack - Confirma tu cuenta',
            text: 'BioVetTrack confirma tu cuenta',
            html: `<p>Hola: ${veterinarian.name}, confirma tu cuenta en Labvet</p>
                   <p>Visita el siguiente enlace:</p>
                   <a href="${process.env.FRONTEND_URL}/auth/confirm-account">Confirma tu cuenta</a>
                   <p>E ingresa el código: <b>${veterinarian.token}</b></p>
                   <p>Expira en 10 minutos.</p>`
        });
    }

    static sendPasswordResetToken = async (veterinarian: Iemail) => {
        await transport.sendMail({
            from: `BioVetTrack <${process.env.EMAIL_USER}>`, // ✅ Usa tu Gmail
            to: veterinarian.email,
            subject: 'BioVetTrack - Reestablece tu contraseña',
            text: 'BioVetTrack - Reestablece tu contraseña',
            html: `<p>Hola: ${veterinarian.name}, has solicitado reestablecer tu contraseña.</p>
                   <p>Visita el siguiente enlace:</p>
                   <a href="${process.env.FRONTEND_URL}/auth/new-password">Reestablece tu contraseña</a>
                   <p>E ingresa el código: <b>${veterinarian.token}</b></p>
                   <p>Expira en 10 minutos.</p>`
        });
    }
}