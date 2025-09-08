// src/routes/patientRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { handleInputErrors } from '../middleware/validation';
import { PatientController } from '../controllers/PatientController';
import upload from '../middleware/upload'; // ✅ Importa multer

const router = Router();

// Validaciones del paciente
const patientValidation = [
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
]
).withMessage('Especie no válida'),

  body('breed')
    .optional()
    .isString().withMessage('La raza debe ser texto')
    .trim(),

  body('weight')
    .optional()
    .isFloat({ min: 0 }).withMessage('El peso debe ser un número positivo o cero'),
];

// Para PUT: campos opcionales, pero si vienen, deben ser válidos
const optionalPatientValidation = [
  body('name')
    .optional()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isString().withMessage('El nombre debe ser texto')
    .trim(),

  body('birthDate')
    .optional()
    .isISO8601().withMessage('Debe ser una fecha válida'),

  body('sex')
    .optional()
    .isIn(['Macho', 'Hembra']).withMessage('Sexo no válido'),

  body('species')
    .optional()
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
    .isFloat({ min: 0 }).withMessage('El peso debe ser positivo'),

  body('owner')
    .optional()
    .isMongoId().withMessage('ID de dueño no válido')
];

// ✅ Ruta POST: Crear paciente con foto
router.post(
  '/:ownerId/patients',
  param('ownerId').isMongoId().withMessage('ID de dueño inválido'),
  upload.single('photo'),
  ...patientValidation,
  handleInputErrors,
  PatientController.createPatient
);

// ✅ Ruta GET: Obtener un paciente por ID
router.get(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  handleInputErrors,
  PatientController.getPatientById
);

// ✅ Ruta PUT: Actualizar paciente
router.put(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  upload.single('photo'), // ✅ LÍNEA AGREGADA: para procesar la foto y los campos del formulario
  ...optionalPatientValidation,
  handleInputErrors,
  PatientController.updatePatient
);

// ✅ Ruta DELETE: Eliminar paciente
router.delete(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  handleInputErrors,
  PatientController.deletePatient
);

// ✅ Ruta GET: Listar pacientes por dueño
router.get(
  '/owner/:ownerId',
  param('ownerId').isMongoId().withMessage('ID de dueño inválido'),
  handleInputErrors,
  PatientController.getPatientsByOwner
);

// ✅ Ruta GET: Listar todos los pacientes
router.get(
  '/',
  PatientController.getAllPatient
);

export default router;