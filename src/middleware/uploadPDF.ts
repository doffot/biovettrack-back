// src/middleware/uploadPDF.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Carpeta temporal para PDFs
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    // Forzar extensión .pdf para seguridad
    cb(null, `study-${uniqueSuffix}.pdf`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Solo PDFs
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'));
  }
};

const uploadPDF = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB para PDFs
  }
});

// Función para eliminar archivos temporales (reutiliza la existente)
export const deleteTempPDFFile = async (filePath: string) => {
  try {
    await fs.promises.unlink(filePath);
    console.log(`✅ PDF temporal eliminado: ${filePath}`);
  } catch (error) {
    console.error('Error eliminando PDF temporal:', error);
  }
};

export default uploadPDF;