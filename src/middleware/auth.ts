import { Request, Response, NextFunction} from 'express'
import jwt from 'jsonwebtoken'
import Veterinarian, { IVeterinarian } from '../models/Veterinarian'

declare global{
    namespace Express{
        interface Request{
            user?: IVeterinarian
        }
    }
}


export const authenticate = async (req: Request, res: Response  , next: NextFunction) =>{
    const bearer = req.headers.authorization
    if(!bearer){
        const error = new Error('No Autorizado')
        return res.status(401).json({error: error.message})
    }

    const token = bearer.split(' ')[1]

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET)

        if(typeof decode === 'object' && decode.id){
        const user = await Veterinarian.findById(decode.id).select('_id name lastName email')
        if(user){
            req.user = user
             next()
        }else{
            res.status(500).json({error: ' el else Token no valido'})
        }
    }

    } catch (error) {
        res.status(500).json({error: 'Token no valido'})
    }

    

}