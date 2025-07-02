import express from 'express';
import { uploadLogo, handleUploadErrors } from '../middlewares/upload.js';

const router = express.Router();

// Debug endpoint to check headers
router.get('/headers', (req, res) => {
  console.log('🔍 Debug headers endpoint called');
  console.log('Headers received:', req.headers);
  
  res.json({
    message: 'Headers debug endpoint',
    headers: req.headers,
    hasAuth: !!req.headers.authorization,
    authHeader: req.headers.authorization || 'Missing'
  });
});

// Simple upload test endpoint (no auth required for debugging)
router.post('/test-upload', uploadLogo, handleUploadErrors, (req, res) => {
  console.log('🚀 Debug upload test received');
  console.log('   Headers:', req.headers);
  console.log('   Content-Type:', req.get('content-type'));
  console.log('   Body keys:', Object.keys(req.body));
  
  if (!req.file) {
    console.log('   ⚠️ No file received in debug test');
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
      debug: {
        contentType: req.get('content-type'),
        bodyKeys: Object.keys(req.body),
        files: req.files || 'none'
      }
    });
  }
  
  console.log('   ✅ File uploaded successfully in debug test:');
  console.log('     Original name:', req.file.originalname);
  console.log('     Filename:', req.file.filename);
  console.log('     Path:', req.file.path);
  console.log('     Size:', req.file.size);
  console.log('     Mime type:', req.file.mimetype);
  
  res.json({
    success: true,
    message: 'Debug upload test successful',
    file: {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: `/logos/${req.file.filename}`
    },
    debug: {
      contentType: req.get('content-type'),
      bodyKeys: Object.keys(req.body)
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    message: 'Debug router is working',
    timestamp: new Date().toISOString(),
    directories: {
      uploadsExists: require('fs').existsSync(require('path').join(process.cwd(), 'uploads')),
      logosExists: require('fs').existsSync(require('path').join(process.cwd(), 'FE', 'public', 'logos'))
    }
  });
});

export default router;
