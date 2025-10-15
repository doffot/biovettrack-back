import { body } from 'express-validator';

// Validaciones comunes para creación de paciente
export const patientValidation = [
  body('name')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isString().withMessage('El nombre debe ser texto')
    .trim(),

  body('birthDate')
    .notEmpty().withMessage('La fecha de nacimiento es obligatoria')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('La fecha debe tener el formato YYYY-MM-DD')
    .custom((value) => {
      const date = new Date(value);
      const isValid = !isNaN(date.getTime());
      const isPast = date <= new Date();
      if (!isValid) throw new Error('Fecha inválida');
      if (!isPast) throw new Error('La fecha no puede ser futura');
      return true;
    }),

  body('sex')
    .notEmpty().withMessage('El sexo es obligatorio')
    .isIn(['Macho', 'Hembra']).withMessage('El sexo debe ser "Macho" o "Hembra"'),

  body('species')
    .notEmpty().withMessage('La especie es obligatoria')
    .isIn([
      "Canino",
      "Felino",
      "Conejo",
      "Ave",
      "Reptil",
      "Roedor",
      "Hurón",
      "Otro"
    ]).withMessage('Especie no válida'),

  body('breed')
    .optional()
    .isString().withMessage('La raza debe ser texto')
    .trim(),

  body('weight')
    .optional()
    .isFloat({ min: 0 }).withMessage('El peso debe ser un número positivo o cero'),

  body('mainVet')
    .notEmpty().withMessage('El veterinario principal es obligatorio'),

  body('referringVet')
    .optional()
    .isString().withMessage('El veterinario referido debe ser texto')
    .trim(),
];