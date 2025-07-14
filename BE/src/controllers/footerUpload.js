import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure upload directory exists
const ensureUploadDir = async (dir) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Configure multer for file upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Upload and process footer logo
export const uploadFooterLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { type = 'partner' } = req.body; // 'main' or 'partner'
    
    // Create directory path
    const uploadDir = path.join(__dirname, '../../uploads/footer');
    await ensureUploadDir(uploadDir);

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${type}_${timestamp}_${originalName}`;
    const filepath = path.join(uploadDir, filename);

    // Process image with Sharp
    let processedImage = sharp(req.file.buffer);
    
    // Resize based on type
    if (type === 'partner') {
      // Resize partner logos to max height 100px, maintain aspect ratio
      processedImage = processedImage.resize(null, 100, {
        fit: 'inside',
        withoutEnlargement: true
      });
    } else {
      // Main logo - resize to max width 200px
      processedImage = processedImage.resize(200, null, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert to webp for better compression
    await processedImage
      .webp({ quality: 85 })
      .toFile(filepath.replace(/\.[^.]+$/, '.webp'));

    // Also save original format
    await processedImage
      .toFile(filepath);

    // Return the file URL
    const fileUrl = `/uploads/footer/${filename}`;
    const webpUrl = `/uploads/footer/${filename.replace(/\.[^.]+$/, '.webp')}`;

    res.json({
      success: true,
      data: {
        url: fileUrl,
        webpUrl: webpUrl,
        filename: filename,
        type: type
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to upload image' 
    });
  }
};

// Delete footer logo
export const deleteFooterLogo = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' });
    }

    const filepath = path.join(__dirname, '../../uploads/footer', filename);
    const webpPath = filepath.replace(/\.[^.]+$/, '.webp');

    // Delete both files if they exist
    try {
      await fs.unlink(filepath);
    } catch (err) {
      // File might not exist
    }
    
    try {
      await fs.unlink(webpPath);
    } catch (err) {
      // WebP file might not exist
    }

    res.json({
      success: true,
      message: 'Logo deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to delete logo' 
    });
  }
};
