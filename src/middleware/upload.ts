// middleware/upload.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Carpeta temporal para archivos antes de subir a Cloudinary
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Guarda temporalmente
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `pet-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Solo imágenes (jpeg, jpg, png, gif)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Función para eliminar archivos temporales
export const deleteTempFile = async (filePath: string) => {
  try {
    await fs.promises.unlink(filePath);
    console.log(`✅ Archivo temporal eliminado: ${filePath}`);
  } catch (error) {
    console.error('Error eliminando archivo temporal:', error);
  }
};

export default upload;