// src/services/AuthEmail.ts
import { resend } from "../config/resend";

interface Iemail {
    email: string;
    name: string;
    token: string;
}

export class AuthEmail {
    static sendConfirmationEmail = async (veterinarian: Iemail) => {
        try {
            const { data, error } = await resend.emails.send({
                from: 'BioVetTrack <onboarding@resend.dev>', // Puedes cambiar el nombre
                to: veterinarian.email,
                subject: 'BioVetTrack - Confirma tu cuenta',
                html: `<p>Hola ${veterinarian.name}, confirma tu cuenta en BioVetTrack.</p>
                       <p>Visita el siguiente enlace:</p>
                       <a href="${process.env.FRONTEND_URL}/auth/confirm-account">Confirma tu cuenta</a>
                       <p>E ingresa el código: <b>${veterinarian.token}</b></p>
                       <p>El código expira en 10 minutos.</p>`
            });

            if (error) {
                console.error('❌ Error al enviar correo de confirmación:', error);
                throw new Error('No se pudo enviar el correo de confirmación');
            }

            console.log('✅ Correo de confirmación enviado:', data.id);
        } catch (err) {
            console.error('❌ Error inesperado al enviar correo:', err);
            throw err;
        }
    }

    static sendPasswordResetToken = async (veterinarian: Iemail) => {
        try {
            const { data, error } = await resend.emails.send({
                from: 'BioVetTrack <onboarding@resend.dev>',
                to: veterinarian.email,
                subject: 'BioVetTrack - Reestablece tu contraseña',
                html: `<p>Hola ${veterinarian.name}, has solicitado reestablecer tu contraseña.</p>
                       <p>Visita el siguiente enlace:</p>
                       <a href="${process.env.FRONTEND_URL}/auth/new-password">Reestablece tu contraseña</a>
                       <p>E ingresa el código: <b>${veterinarian.token}</b></p>
                       <p>El código expira en 10 minutos.</p>`
            });

            if (error) {
                console.error('❌ Error al enviar correo de restablecimiento:', error);
                throw new Error('No se pudo enviar el correo de restablecimiento');
            }

            console.log('✅ Correo de restablecimiento enviado:', data.id);
        } catch (err) {
            console.error('❌ Error inesperado al enviar correo:', err);
            throw err;
        }
    }
}