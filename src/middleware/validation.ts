import { Request, Response, NextFunction } from "express"
import { validationResult } from 'express-validator'

export const handleInputErrors = (req : Request, res: Response, next: NextFunction) =>{

    let errors = validationResult(req)
     
    if(!errors.isEmpty()){
        res.json({
            "message": errors.array(),
            "status": 400
        })
 
        return
    }

    next()
}