import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure directories exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const logosDir = path.join(uploadsDir, 'logos');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// Configure multer storage for logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save to backend uploads directory that can be served as static
    const uploadsLogoDir = path.join(process.cwd(), 'uploads', 'logos');
    
    // Ensure directory exists at upload time
    if (!fs.existsSync(uploadsLogoDir)) {
      fs.mkdirSync(uploadsLogoDir, { recursive: true });
    }
    
    cb(null, uploadsLogoDir);
  },
  filename: (req, file, cb) => {
    // Use site id as prefix if available for better organization
    const sitePrefix = req.params.id || 'site';
    const extension = path.extname(file.originalname);
    const filename = `${sitePrefix}-logo${extension}`;
    
    cb(null, filename);
  }
});

// File filter for logos (only images)
const logoFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// Create multer instances for file upload (backup method)
export const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: logoFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single('logo');

// Memory storage for base64 conversion
const memoryStorage = multer.memoryStorage();

export const uploadLogoToBase64 = multer({
  storage: memoryStorage,
  fileFilter: logoFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for base64
  },
}).single('logo');

// File filter for Excel files
const excelFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) and CSV files are allowed.'), false);
  }
};

// Create multer instance for Excel file upload
export const uploadExcel = multer({
  storage: memoryStorage,
  fileFilter: excelFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for Excel files
  },
}).single('excelFile');

// Middleware to handle upload errors
export const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer Error:', err.code, err.message);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      // Check if this is an Excel upload based on the field name
      const isExcelUpload = req.body && (req.body.excelFile || req.file?.fieldname === 'excelFile');
      
      if (isExcelUpload) {
        return res.status(413).json({
          success: false,
          message: 'File size too large. Maximum size is 20MB.',
          error: 'FILE_TOO_LARGE',
          details: {
            maxSize: '20MB',
            received: req.file ? `${(req.file.size / 1024 / 1024).toFixed(2)}MB` : 'unknown'
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Logo file size too large. Maximum size is 5MB.',
          error: 'FILE_TOO_LARGE',
          details: {
            maxSize: '5MB',
            received: req.file ? `${(req.file.size / 1024 / 1024).toFixed(2)}MB` : 'unknown'
          }
        });
      }
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Please upload only one logo file.',
        error: 'TOO_MANY_FILES'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Invalid form field name. Please use "logo" as the field name.',
        error: 'INVALID_FIELD_NAME',
        details: {
          expectedField: 'logo',
          receivedField: err.field
        }
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Logo upload error: ' + err.message,
      error: 'UPLOAD_ERROR',
      code: err.code
    });
  }
  
  if (err) {
    console.error('❌ Upload validation error:', err.message);
    
    // Handle file type validation errors
    if (err.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid logo file type. Please upload JPEG, PNG, GIF, or WebP images only.',
        error: 'INVALID_FILE_TYPE',
        details: {
          allowedTypes: ['JPEG', 'JPG', 'PNG', 'GIF', 'WebP'],
          receivedType: req.file ? req.file.mimetype : 'unknown'
        }
      });
    }
    
    return res.status(400).json({
      success: false,
      message: err.message,
      error: 'INVALID_FILE'
    });
  }
  
  next();
};

// Helper function to delete old logo file
export const deleteOldLogo = (logoPath) => {
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      fs.unlinkSync(logoPath);
      } catch (error) {
      console.error('Error deleting old logo:', error);
    }
  }
};

// Helper function to get full logo URL for public assets
export const getLogoUrl = (req, filename) => {
  if (!filename) return null;
  // For public assets, use relative path from public directory
  return `/logos/${filename}`;
};

export default {
  uploadLogo,
  handleUploadErrors,
  deleteOldLogo,
  getLogoUrl
};
