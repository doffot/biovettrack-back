// ./types/express.d.ts
import { IVeterinarian } from "../models/Veterinarian";

declare global {
  namespace Express {
    interface Request {
      user?: IVeterinarian;
    }
  }
}

export {};
