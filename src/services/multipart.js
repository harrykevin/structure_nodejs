import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the "uploads/images" and "uploads/files" directories exist
const uploadDir = path.join(__dirname, 'uploads');
const imagesDir = path.join(uploadDir, 'images');
const filesDir = path.join(uploadDir, 'files');

// Initialize the S3 Client (Using v3 SDK)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

export const localStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    const imageTypes = /jpeg|jpg|png|gif/;
    const fileTypes = /pdf|csv|msword|vnd.openxmlformats-officedocument.wordprocessingml.document/;
    const isImage = imageTypes.test(file.mimetype);
    const isFile = fileTypes.test(file.mimetype);

    if (isImage) {
      callback(null, imagesDir);
    } else if (isFile) {
      callback(null, filesDir);
    } else {
      callback(new Error('Unsupported file type'), null);
    }
  },
  filename: (req, file, callback) => {
    const fileName = file.originalname.split(' ').join('-');
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);
    const uniqueName = `${baseName}-${Date.now()}${extension}`;
    req.body.picture = uniqueName;
    callback(null, uniqueName);
  },
});

export const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME, // Replace with your S3 bucket name
  // acl: 'public-read', // Set your desired permissions (e.g., public-read) 123
  metadata: (req, file, callback) => {
    callback(null, { fieldName: file.fieldname });
  },
  key: (req, file, callback) => {
    const imageTypes = /jpeg|jpg|png|gif/;
    const fileTypes = /pdf|csv|msword|vnd.openxmlformats-officedocument.wordprocessingml.document/;
    const isImage = imageTypes.test(file.mimetype);
    const isFile = fileTypes.test(file.mimetype);

    let fileName = file.originalname.split(' ').join('-');
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);
    const uniqueName = `${baseName}-${Date.now()}${extension}`;

    req.body.picture = uniqueName;

    if (isImage) {
      callback(null, `uploads/images/${uniqueName}`);
    } else if (isFile) {
      callback(null, `uploads/files/${uniqueName}`);
    } else {
      callback(new Error('Unsupported file type'), null);
    }
  },
});
// Choose storage based on environment
const storage = process.env.APP_ENV === 'production' ? s3Storage : localStorage;

export const handleMultipartData = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 100, // 100 MB limit
  },
  fileFilter: (req, file, callback) => {
    const imageTypes = /jpeg|jpg|png|gif/;
    const fileTypes = /pdf|csv|msword|vnd.openxmlformats-officedocument.wordprocessingml.document/;
    const mimetype = imageTypes.test(file.mimetype) || fileTypes.test(file.mimetype);
    const extname = imageTypes.test(path.extname(file.originalname).toLowerCase()) || fileTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return callback(null, true);
    }
    callback(new Error('File type not supported. Only JPEG, PNG, GIF, PDF, CSV, and Word files are allowed.'));
  },
});
