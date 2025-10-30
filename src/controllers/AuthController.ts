import type { Request, Response } from "express";

import Veterinarian from "../models/Veterinarian";
import { checkPassword, hashPassword } from "../utils/auth";
import Token from "../models/token";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/AuthEmail";
import { generateJWT } from "../utils/jwt";

export class AuthController {
  static createAccount = async (req: Request, res: Response) => {
    try {
      const { password, email } = req.body;
      // prevenir duplicado
      const veterinarianExists = await Veterinarian.findOne({ email });
      if (veterinarianExists) {
        const error = new Error("Veterinario ya Resgistrado");
        return res.status(409).json({ error: error.message });
      }
      const veterinarian = new Veterinarian(req.body);

      //hash password
      veterinarian.password = await hashPassword(password);

      //generar token
      const token = new Token();
      token.token = generateToken();
      token.veterinarian = veterinarian.id;

      //enviar email
      AuthEmail.sendConfirmationEmail({
        email: veterinarian.email,
        name: veterinarian.name,
        token: token.token,
      });

      await Promise.allSettled([token.save(), veterinarian.save()]);

      res.send(
        "Cuenta creada correctamente revisa tu email para confirmalas credenciales"
      );
    } catch (error) {
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

      const veterinarian = await Veterinarian.findById(
        tokenExists.veterinarian
      );
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
        const token = new Token()
        token.veterinarian = veterinarian.id;
        token.token = generateToken();
        await token.save();
          //enviar email
      AuthEmail.sendConfirmationEmail({
        email: veterinarian.email,
        name: veterinarian.name,
        token: token.token,
      });


        const error = new Error("Veterinario no confirmado, revisa tu email");
        return res.status(403).json({ error: error.message });
      }

     
//revisar pass
const isPasswordCorrect = await checkPassword(password, veterinarian.password);
if (!isPasswordCorrect) {
  const error = new Error("Contraseña incorrecta");
  return res.status(401).json({ error: error.message });
}

const token = generateJWT({id:veterinarian.id});

res.send(token);

     } catch (error) {
      res.status(500).json({ error: "Error al crear cuenta" });
    }
  };


  static requestNewToken = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      // Usuario existe
      const veterinarian = await Veterinarian.findOne({ email });
      if (!veterinarian) {
        const error = new Error("Veterinario no esta Resgistrado");
        return res.status(404).json({ error: error.message });
      }

      if(veterinarian.confirmed){
        const error = new Error("Veterinario ya esta confirmado");
        return res.status(403).json({ error: error.message });
      }
    

      //generar token
      const token = new Token();
      token.token = generateToken();
      token.veterinarian = veterinarian.id;

      //enviar email
      AuthEmail.sendConfirmationEmail({
        email: veterinarian.email,
        name: veterinarian.name,
        token: token.token,
      });

      await Promise.allSettled([token.save(), veterinarian.save()]);

      res.send(
        "Se envio un nuevo Token a tu email"
      );
    } catch (error) {
      res.status(500).json({ error: "Error al crear cuenta" });
    }
  };

   static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      // Usuario existe
      const veterinarian = await Veterinarian.findOne({ email });
      if (!veterinarian) {
        const error = new Error("Veterinario no esta Resgistrado");
        return res.status(404).json({ error: error.message });
      }

    
    

      //generar token
      const token = new Token();
      token.token = generateToken();
      token.veterinarian = veterinarian.id;
      await token.save();


      //enviar email
      AuthEmail.sendPasswordResetToken({
        email: veterinarian.email,
        name: veterinarian.name,
        token: token.token,
      });


      res.send(
        "Revisa tu email para instrucciones"
      );
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


}
