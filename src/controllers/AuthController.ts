import type { Request, Response } from "express";

import Veterinarian from "../models/Veterinarian";
import { checkPassword, hashPassword } from "../utils/auth";
import Token from "../models/token";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/AuthEmail";
import { generateJWT } from "../utils/jwt";
import Staff from "../models/Staff";

export class AuthController {
  static createAccount = async (req: Request, res: Response) => {
    try {
      const { password, email, ci, whatsapp } = req.body;

      // Validar email duplicado
      const veterinarianByEmail = await Veterinarian.findOne({ email });
      if (veterinarianByEmail) {
        const error = new Error("El email ya está registrado");
        return res.status(409).json({ error: error.message });
      }

      // Validar cédula duplicada
      if (ci) {
        const veterinarianByCi = await Veterinarian.findOne({ ci });
        if (veterinarianByCi) {
          const error = new Error("La cédula ya está registrada");
          return res.status(409).json({ error: error.message });
        }
      }

      // Validar teléfono duplicado
      if (whatsapp) {
        const veterinarianByWhatsapp = await Veterinarian.findOne({ whatsapp });
        if (veterinarianByWhatsapp) {
          const error = new Error("El número de WhatsApp ya está registrado");
          return res.status(409).json({ error: error.message });
        }
      }

      const veterinarian = new Veterinarian(req.body);
      veterinarian.password = await hashPassword(password);

      // Generar token
      const token = new Token();
      token.token = generateToken();
      token.veterinarian = veterinarian.id;

      // Enviar email
      AuthEmail.sendConfirmationEmail({
        email: veterinarian.email,
        name: veterinarian.name,
        token: token.token,
      });

      await veterinarian.save();
      await token.save();

      // Crear Staff
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
        console.warn(
          "No se pudo crear la entrada de Staff para el dueño:",
          staffError
        );
      }

      res.send(
        "Cuenta creada correctamente, revisa tu email para confirmar las credenciales"
      );
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
        const error = new Error("token no Valido");
        return res.status(401).json({ error: error.message });
      }

      const veterinarian = await Veterinarian.findById(tokenExists.veterinarian);
      veterinarian.confirmed = true;
      await Promise.allSettled([tokenExists.deleteOne(), veterinarian.save()]);

      res.send("Cuenta confirmada correctamente");
    } catch (error) {
      res.status(500).json({ error: "Error al crear cuenta" });
    }
  };

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const veterinarian = await Veterinarian.findOne({ email });
      if (!veterinarian) {
        const error = new Error("Veterinario no existe");
        return res.status(404).json({ error: error.message });
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

        const error = new Error("Veterinario no confirmado, revisa tu email");
        return res.status(403).json({ error: error.message });
      }

      const isPasswordCorrect = await checkPassword(
        password,
        veterinarian.password
      );
      if (!isPasswordCorrect) {
        const error = new Error("Contraseña incorrecta");
        return res.status(401).json({ error: error.message });
      }

      const token = generateJWT({ id: veterinarian.id });

      res.send(token);
    } catch (error) {
      res.status(500).json({ error: "Error al crear cuenta" });
    }
  };

  static requestNewToken = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const veterinarian = await Veterinarian.findOne({ email });
      if (!veterinarian) {
        const error = new Error("Veterinario no esta Resgistrado");
        return res.status(404).json({ error: error.message });
      }

      if (veterinarian.confirmed) {
        const error = new Error("Veterinario ya esta confirmado");
        return res.status(403).json({ error: error.message });
      }

      const token = new Token();
      token.token = generateToken();
      token.veterinarian = veterinarian.id;

      AuthEmail.sendConfirmationEmail({
        email: veterinarian.email,
        name: veterinarian.name,
        token: token.token,
      });

      await Promise.allSettled([token.save(), veterinarian.save()]);

      res.send("Se envio un nuevo Token a tu email");
    } catch (error) {
      res.status(500).json({ error: "Error al crear cuenta" });
    }
  };

  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const veterinarian = await Veterinarian.findOne({ email });
      if (!veterinarian) {
        const error = new Error("Veterinario no esta Resgistrado");
        return res.status(404).json({ error: error.message });
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
      res.status(500).json({ error: "Error al crear cuenta" });
    }
  };

  static validateToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      const tokenExists = await Token.findOne({ token });
      if (!tokenExists) {
        const error = new Error("token no Valido");
        return res.status(401).json({ error: error.message });
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
        const error = new Error("token no Valido");
        return res.status(401).json({ error: error.message });
      }

      const veterinarian = await Veterinarian.findById(tokenExists.veterinarian);
      veterinarian.password = await hashPassword(req.body.password);

      await Promise.allSettled([tokenExists.deleteOne(), veterinarian.save()]);

      res.send("Password actualizada correctamente");
    } catch (error) {
      res.status(500).json({ error: "Error al crear cuenta" });
    }
  };

  static user = async (req: Request, res: Response) => {
    return res.json(req.user);
  };

  // =====================================================
  // ✅ NUEVOS MÉTODOS PARA PERFIL
  // =====================================================

  /**
   * Obtener perfil completo del veterinario autenticado
   * GET /auth/profile
   */
  static getProfile = async (req: Request, res: Response) => {
    try {
      const veterinarian = await Veterinarian.findById(req.user._id).select(
        "-password"
      );

      if (!veterinarian) {
        const error = new Error("Veterinario no encontrado");
        return res.status(404).json({ error: error.message });
      }

      res.json(veterinarian);
    } catch (error) {
      console.error("Error en getProfile:", error);
      res.status(500).json({ error: "Error al obtener perfil" });
    }
  };

  /**
   * Actualizar datos del perfil
   * PUT /auth/profile
   */
  static updateProfile = async (req: Request, res: Response) => {
    try {
      const { name, lastName, whatsapp, estado, runsai, msds, somevepa } =
        req.body;

      // Verificar que el whatsapp no esté en uso por otro usuario
      const whatsappExists = await Veterinarian.findOne({
        whatsapp,
        _id: { $ne: req.user._id },
      });

      if (whatsappExists) {
        const error = new Error("Este número de WhatsApp ya está registrado");
        return res.status(409).json({ error: error.message });
      }

      // Buscar y actualizar
      const veterinarian = await Veterinarian.findById(req.user._id);

      if (!veterinarian) {
        const error = new Error("Veterinario no encontrado");
        return res.status(404).json({ error: error.message });
      }

      // Actualizar solo campos permitidos
      veterinarian.name = name;
      veterinarian.lastName = lastName;
      veterinarian.whatsapp = whatsapp;
      veterinarian.estado = estado;
      veterinarian.runsai = runsai || null;
      veterinarian.msds = msds || null;
      veterinarian.somevepa = somevepa || null;

      await veterinarian.save();

      // Actualizar también el Staff si existe
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

      // Devolver sin password
      const updatedVeterinarian = await Veterinarian.findById(
        req.user._id
      ).select("-password");

      res.json(updatedVeterinarian);
    } catch (error) {
      console.error("Error en updateProfile:", error);
      res.status(500).json({ error: "Error al actualizar perfil" });
    }
  };

  /**
   * Cambiar contraseña (requiere contraseña actual)
   * POST /auth/change-password
   */
  static changePassword = async (req: Request, res: Response) => {
    try {
      const { currentPassword, password } = req.body;

      // Buscar veterinario CON password para comparar
      const veterinarian = await Veterinarian.findById(req.user._id);

      if (!veterinarian) {
        const error = new Error("Veterinario no encontrado");
        return res.status(404).json({ error: error.message });
      }

      // Verificar contraseña actual
      const isPasswordCorrect = await checkPassword(
        currentPassword,
        veterinarian.password
      );

      if (!isPasswordCorrect) {
        const error = new Error("La contraseña actual es incorrecta");
        return res.status(401).json({ error: error.message });
      }

      // Actualizar a nueva contraseña
      veterinarian.password = await hashPassword(password);
      await veterinarian.save();

      res.send("Contraseña actualizada correctamente");
    } catch (error) {
      console.error("Error en changePassword:", error);
      res.status(500).json({ error: "Error al cambiar contraseña" });
    }
  };
}