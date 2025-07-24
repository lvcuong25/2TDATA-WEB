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

// Predefined size configurations for partner logos
const PARTNER_SIZES = {
  'small': { height: 60 },    // For smaller logos like HCW, REMOBPO
  'medium': { height: 80 },   // Medium size
  'large': { height: 100 },   // For main partner like 2T DATA
  'custom': null              // Use provided dimensions
};

// Upload and process footer logo
export const uploadFooterLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { 
      type = 'partner', 
      size = 'medium',  // 'small', 'medium', 'large', 'custom'
      customHeight,     // Custom height if size is 'custom'
      preserveOriginal = false // Whether to keep original size version
    } = req.body;
    
    // Create directory path
    const uploadDir = path.join(__dirname, '../../uploads/footer');
    await ensureUploadDir(uploadDir);

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const baseFilename = `${type}_${timestamp}_${originalName}`;
    
    // Get original image metadata
    const metadata = await sharp(req.file.buffer).metadata();
    
    // Process and save different versions
    const versions = [];
    
    // 1. Save original size if requested
    if (preserveOriginal) {
      const originalFilename = `original_${baseFilename}`;
      const originalPath = path.join(uploadDir, originalFilename);
      
      await sharp(req.file.buffer)
        .toFile(originalPath);
        
      versions.push({
        type: 'original',
        url: `/uploads/footer/${originalFilename}`,
        width: metadata.width,
        height: metadata.height
      });
    }
    
    // 2. Save resized version based on size parameter
    let targetHeight;
    if (size === 'custom' && customHeight) {
      targetHeight = parseInt(customHeight);
    } else if (PARTNER_SIZES[size]) {
      targetHeight = PARTNER_SIZES[size].height;
    } else {
      targetHeight = PARTNER_SIZES.medium.height; // Default to medium
    }
    
    const resizedFilename = `${size}_${baseFilename}`;
    const resizedPath = path.join(uploadDir, resizedFilename);
    
    // Resize maintaining aspect ratio
    const resizedImage = await sharp(req.file.buffer)
      .resize(null, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    
    // Save in original format
    await resizedImage.toFile(resizedPath);
    
    // Get resized dimensions
    const resizedMetadata = await resizedImage.metadata();
    
    versions.push({
      type: size,
      url: `/uploads/footer/${resizedFilename}`,
      width: resizedMetadata.width,
      height: resizedMetadata.height
    });
    
    // 3. Create WebP version for better performance
    const webpFilename = resizedFilename.replace(/\.[^.]+$/, '.webp');
    const webpPath = path.join(uploadDir, webpFilename);
    
    await resizedImage
      .webp({ quality: 85 })
      .toFile(webpPath);
      
    versions.push({
      type: `${size}_webp`,
      url: `/uploads/footer/${webpFilename}`,
      width: resizedMetadata.width,
      height: resizedMetadata.height
    });

    // Return all versions with the main URL being the resized version
    res.json({
      success: true,
      data: {
        url: versions.find(v => v.type === size).url,
        webpUrl: versions.find(v => v.type === `${size}_webp`).url,
        filename: resizedFilename,
        type: type,
        size: size,
        dimensions: {
          width: resizedMetadata.width,
          height: resizedMetadata.height
        },
        versions: versions
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

// Delete footer logo (all versions)
export const deleteFooterLogo = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' });
    }

    const uploadDir = path.join(__dirname, '../../uploads/footer');
    
    // Extract base filename (remove size prefix if exists)
    const baseFilename = filename.replace(/^(small_|medium_|large_|custom_|original_)/, '');
    
    // Try to delete all possible versions
    const prefixes = ['small_', 'medium_', 'large_', 'custom_', 'original_', ''];
    const deletedFiles = [];
    
    for (const prefix of prefixes) {
      const versionFilename = prefix + baseFilename;
      const filepath = path.join(uploadDir, versionFilename);
      const webpPath = filepath.replace(/\.[^.]+$/, '.webp');
      
      // Try to delete original format
      try {
        await fs.unlink(filepath);
        deletedFiles.push(versionFilename);
      } catch (err) {
        // File might not exist
      }
      
      // Try to delete WebP version
      try {
        await fs.unlink(webpPath);
        deletedFiles.push(versionFilename.replace(/\.[^.]+$/, '.webp'));
      } catch (err) {
        // WebP file might not exist
      }
    }

    res.json({
      success: true,
      message: 'Logo deleted successfully',
      deletedFiles: deletedFiles
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to delete logo' 
    });
  }
};

// Get recommended size for partner name
export const getRecommendedSize = async (req, res) => {
  try {
    const { partnerName } = req.query;
    
    // Recommendations based on common partner names
    const sizeRecommendations = {
      'HCW': 'small',
      'REMOBPO': 'small',
      '2T DATA': 'large',
      'default': 'medium'
    };
    
    const recommendedSize = sizeRecommendations[partnerName] || sizeRecommendations.default;
    const sizeConfig = PARTNER_SIZES[recommendedSize];
    
    res.json({
      success: true,
      data: {
        recommendedSize: recommendedSize,
        height: sizeConfig.height,
        message: `Recommended size for ${partnerName || 'partner'} logo`
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to get recommendation' 
    });
  }
};
