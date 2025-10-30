import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Types } from "mongoose";
dotenv.config();

type UserPayload = {
   id: Types.ObjectId;
}

export const generateJWT = (payload: UserPayload) =>{
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn:'180d'})

    return token;
}

