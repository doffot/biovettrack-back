import type { Request, Response } from "express";
import Veterinarian from "../models/Veterinarian";
import { checkPassword, hashPassword } from "../utils/auth";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/AuthEmail";
import { generateJWT } from "../utils/jwt";
import Staff from "../models/Staff";
import Token from "../models/token";

export class AuthController {
  static createAccount = async (req: Request, res: Response) => {
    try {
      const { password, email, ci, whatsapp } = req.body;

      const veterinarianByEmail = await Veterinarian.findOne({ email });
      if (veterinarianByEmail) {
        return res.status(409).json({ error: "El email ya está registrado" });
      }

      if (ci) {
        const veterinarianByCi = await Veterinarian.findOne({ ci });
        if (veterinarianByCi) {
          return res.status(409).json({ error: "La cédula ya está registrada" });
        }
      }

      if (whatsapp) {
        const veterinarianByWhatsapp = await Veterinarian.findOne({ whatsapp });
        if (veterinarianByWhatsapp) {
          return res.status(409).json({ error: "El número de WhatsApp ya está registrado" });
        }
      }

      const veterinarian = new Veterinarian(req.body);
      veterinarian.password = await hashPassword(password);

      // Inicializar plan para nuevos usuarios
      const now = new Date();
      veterinarian.isLegacyUser = false;
      veterinarian.planType = 'trial';
      veterinarian.trialStartedAt = now;
      veterinarian.trialEndedAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      veterinarian.isActive = true;
      veterinarian.patientCount = 0;

      const token = new Token();
      token.token = generateToken();
      token.veterinarian = veterinarian.id;

      AuthEmail.sendConfirmationEmail({
        email: veterinarian.email,
        name: veterinarian.name,
        token: token.token,
      });

      await veterinarian.save();
      await token.save();

      try {
        const staff = new Staff({
          name: veterinarian.name,
          lastName: veterinarian.lastName,
          role: "veterinario",
          isOwner: true,
          veterinarianId: veterinarian._id,
          phone: veterinarian.whatsapp || undefined,
          active: true,
        });
        await staff.save();
      } catch (staffError) {
        console.warn("No se pudo crear la entrada de Staff para el dueño:", staffError);
      }

      res.send("Cuenta creada correctamente, revisa tu email para confirmar las credenciales");
    } catch (error) {
      console.error("Error en createAccount:", error);
      res.status(500).json({ error: "Error al crear cuenta" });
    }
  };

  static confirmAccount = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const tokenExists = await Token.findOne({ token });
      if (!tokenExists) {
        return res.status(401).json({ error: "token no Valido" });
      }

      const veterinarian = await Veterinarian.findById(tokenExists.veterinarian);
      veterinarian.confirmed = true;
      await Promise.allSettled([tokenExists.deleteOne(), veterinarian.save()]);
      res.send("Cuenta confirmada correctamente");
    } catch (error) {
      res.status(500).json({ error: "Error al confirmar cuenta" });
    }
  };

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const veterinarian = await Veterinarian.findOne({ email });
      if (!veterinarian) {
        return res.status(404).json({ error: "Veterinario no existe" });
      }

      if (!veterinarian.confirmed) {
        const token = new Token();
        token.veterinarian = veterinarian.id;
        token.token = generateToken();
        await token.save();

        AuthEmail.sendConfirmationEmail({
          email: veterinarian.email,
          name: veterinarian.name,
          token: token.token,
        });

        return res.status(403).json({ error: "Veterinario no confirmado, revisa tu email" });
      }

      const isPasswordCorrect = await checkPassword(password, veterinarian.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ error: "Contraseña incorrecta" });
      }

      // Verificar estado del plan
      if (!veterinarian.isLegacyUser) {
        const now = new Date();
        if (veterinarian.planType === 'trial' && now > veterinarian.trialEndedAt) {
          veterinarian.isActive = false;
          await veterinarian.save();
          return res.status(403).json({ error: "Tu período de prueba ha terminado. Actualiza tu plan para continuar." });
        }
      }

      if (!veterinarian.isActive) {
        return res.status(403).json({ error: "Cuenta inactiva. Contacta al soporte." });
      }

      const token = generateJWT({ id: veterinarian.id });
      res.send(token);
    } catch (error) {
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  };

  static requestNewToken = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const veterinarian = await Veterinarian.findOne({ email });
      if (!veterinarian) {
        return res.status(404).json({ error: "Veterinario no esta Resgistrado" });
      }

      if (veterinarian.confirmed) {
        return res.status(403).json({ error: "Veterinario ya esta confirmado" });
      }

      const token = new Token();
      token.token = generateToken();
      token.veterinarian = veterinarian.id;
      await token.save();

      AuthEmail.sendConfirmationEmail({
        email: veterinarian.email,
        name: veterinarian.name,
        token: token.token,
      });

      res.send("Se envio un nuevo Token a tu email");
    } catch (error) {
      res.status(500).json({ error: "Error al solicitar nuevo token" });
    }
  };

  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const veterinarian = await Veterinarian.findOne({ email });
      if (!veterinarian) {
        return res.status(404).json({ error: "Veterinario no esta Resgistrado" });
      }

      const token = new Token();
      token.token = generateToken();
      token.veterinarian = veterinarian.id;
      await token.save();

      AuthEmail.sendPasswordResetToken({
        email: veterinarian.email,
        name: veterinarian.name,
        token: token.token,
      });

      res.send("Revisa tu email para instrucciones");
    } catch (error) {
      res.status(500).json({ error: "Error al solicitar recuperación de contraseña" });
    }
  };

  static validateToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const tokenExists = await Token.findOne({ token });
      if (!tokenExists) {
        return res.status(401).json({ error: "token no Valido" });
      }
      res.send("Token valido, define tu password");
    } catch (error) {
      res.status(500).json({ error: "Error al validar token" });
    }
  };

  static updatePasswordWithToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const tokenExists = await Token.findOne({ token });
      if (!tokenExists) {
        return res.status(401).json({ error: "token no Valido" });
      }

      const veterinarian = await Veterinarian.findById(tokenExists.veterinarian);
      veterinarian.password = await hashPassword(req.body.password);
      await Promise.allSettled([tokenExists.deleteOne(), veterinarian.save()]);
      res.send("Password actualizada correctamente");
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar contraseña" });
    }
  };

  static user = async (req: Request, res: Response) => {
    return res.json(req.user);
  };

  static getProfile = async (req: Request, res: Response) => {
    try {
      const veterinarian = await Veterinarian.findById(req.user._id).select("-password");
      if (!veterinarian) {
        return res.status(404).json({ error: "Veterinario no encontrado" });
      }
      res.json(veterinarian);
    } catch (error) {
      console.error("Error en getProfile:", error);
      res.status(500).json({ error: "Error al obtener perfil" });
    }
  };

  static updateProfile = async (req: Request, res: Response) => {
    try {
      const { name, lastName, whatsapp, estado, runsai, msds, somevepa } = req.body;

      const whatsappExists = await Veterinarian.findOne({
        whatsapp,
        _id: { $ne: req.user._id },
      });

      if (whatsappExists) {
        return res.status(409).json({ error: "Este número de WhatsApp ya está registrado" });
      }

      const veterinarian = await Veterinarian.findById(req.user._id);
      if (!veterinarian) {
        return res.status(404).json({ error: "Veterinario no encontrado" });
      }

      veterinarian.name = name;
      veterinarian.lastName = lastName;
      veterinarian.whatsapp = whatsapp;
      veterinarian.estado = estado;
      veterinarian.runsai = runsai || null;
      veterinarian.msds = msds || null;
      veterinarian.somevepa = somevepa || null;

      await veterinarian.save();

      try {
        await Staff.findOneAndUpdate(
          { veterinarianId: req.user._id, isOwner: true },
          {
            name: veterinarian.name,
            lastName: veterinarian.lastName,
            phone: veterinarian.whatsapp,
          }
        );
      } catch (staffError) {
        console.warn("No se pudo actualizar el Staff:", staffError);
      }

      const updatedVeterinarian = await Veterinarian.findById(req.user._id).select("-password");
      res.json(updatedVeterinarian);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar perfil" });
    }
  };

  static changePassword = async (req: Request, res: Response) => {
    try {
      const { currentPassword, password } = req.body;
      const veterinarian = await Veterinarian.findById(req.user._id);
      if (!veterinarian) {
        return res.status(404).json({ error: "Veterinario no encontrado" });
      }

      const isPasswordCorrect = await checkPassword(currentPassword, veterinarian.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ error: "La contraseña actual es incorrecta" });
      }

      veterinarian.password = await hashPassword(password);
      await veterinarian.save();
      res.send("Contraseña actualizada correctamente");
    } catch (error) {
      console.error("Error en changePassword:", error);
      res.status(500).json({ error: "Error al cambiar contraseña" });
    }
  };
}