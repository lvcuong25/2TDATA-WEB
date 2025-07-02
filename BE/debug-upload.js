import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Test upload configuration
const testUploadSetup = () => {
  console.log('🔍 Debugging Upload Configuration...\n');
  
  // 1. Check directories
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const logosDir = path.join(uploadsDir, 'logos');
  const fePublicDir = path.join(process.cwd(), 'FE', 'public', 'logos');
  
  console.log('📁 Directory Checks:');
  console.log(`   uploads: ${uploadsDir} - ${fs.existsSync(uploadsDir) ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`   logos: ${logosDir} - ${fs.existsSync(logosDir) ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`   FE public logos: ${fePublicDir} - ${fs.existsSync(fePublicDir) ? '✅ EXISTS' : '❌ MISSING'}`);
  
  // 2. Create missing directories
  [uploadsDir, logosDir, fePublicDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   ✅ Created: ${dir}`);
      } catch (error) {
        console.log(`   ❌ Failed to create: ${dir} - ${error.message}`);
      }
    }
  });
  
  // 3. Test multer configuration
  console.log('\n⚙️ Multer Configuration Test:');
  try {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        console.log('   📍 Destination called with file:', file.originalname);
        cb(null, fePublicDir);
      },
      filename: (req, file, cb) => {
        const filename = `test-logo-${Date.now()}${path.extname(file.originalname)}`;
        console.log('   📝 Generated filename:', filename);
        cb(null, filename);
      }
    });
    
    const upload = multer({
      storage,
      fileFilter: (req, file, cb) => {
        console.log('   🔍 File filter checking:', file.mimetype);
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
          console.log('   ✅ File type accepted');
          cb(null, true);
        } else {
          console.log('   ❌ File type rejected');
          cb(new Error('Invalid file type'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
      }
    });
    
    console.log('   ✅ Multer configuration created successfully');
  } catch (error) {
    console.log('   ❌ Multer configuration failed:', error.message);
  }
  
  // 4. Check permissions
  console.log('\n🔐 Permission Checks:');
  try {
    const testFile = path.join(fePublicDir, 'test-write.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('   ✅ Write permissions OK');
  } catch (error) {
    console.log('   ❌ Write permission error:', error.message);
  }
  
  console.log('\n🎯 Upload Endpoint Analysis:');
  console.log('   Route: PUT /api/sites/:id');
  console.log('   Middlewares: uploadLogo → handleUploadErrors → requireSuperAdmin → updateSite');
  console.log('   Expected form field: "logo"');
  console.log('   Content-Type: multipart/form-data');
  
  return {
    uploadsDir: fs.existsSync(uploadsDir),
    logosDir: fs.existsSync(logosDir),
    fePublicDir: fs.existsSync(fePublicDir),
    canWrite: true
  };
};

// Test server for upload debugging
const startDebugServer = () => {
  const app = express();
  
  // Basic middleware
  app.use(express.json());
  
  // Test upload endpoint
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const fePublicDir = path.join(process.cwd(), 'FE', 'public', 'logos');
      if (!fs.existsSync(fePublicDir)) {
        fs.mkdirSync(fePublicDir, { recursive: true });
      }
      cb(null, fePublicDir);
    },
    filename: (req, file, cb) => {
      const filename = `debug-test-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, filename);
    }
  });
  
  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  }).single('logo');
  
  // Debug upload endpoint
  app.post('/debug-upload', (req, res) => {
    console.log('\n🚀 Debug upload request received');
    console.log('   Headers:', req.headers);
    console.log('   Content-Type:', req.get('content-type'));
    
    upload(req, res, (err) => {
      if (err) {
        console.log('   ❌ Upload error:', err.message);
        return res.status(400).json({
          success: false,
          message: err.message,
          error: err.code || 'UPLOAD_ERROR'
        });
      }
      
      if (!req.file) {
        console.log('   ⚠️ No file received');
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      console.log('   ✅ File uploaded successfully:');
      console.log('     Original name:', req.file.originalname);
      console.log('     Filename:', req.file.filename);
      console.log('     Path:', req.file.path);
      console.log('     Size:', req.file.size);
      console.log('     Mime type:', req.file.mimetype);
      
      res.json({
        success: true,
        message: 'File uploaded successfully',
        file: {
          originalname: req.file.originalname,
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: `/logos/${req.file.filename}`
        }
      });
    });
  });
  
  // Health check
  app.get('/debug-health', (req, res) => {
    res.json({
      message: 'Debug server is running',
      timestamp: new Date().toISOString()
    });
  });
  
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`\n🚀 Debug server started on http://localhost:${PORT}`);
    console.log(`   Test upload: POST http://localhost:${PORT}/debug-upload`);
    console.log(`   Health check: GET http://localhost:${PORT}/debug-health`);
    console.log('\n📝 Test with curl:');
    console.log(`   curl -X POST -F "logo=@path/to/image.jpg" http://localhost:${PORT}/debug-upload`);
  });
};

// Run diagnostics
const main = () => {
  console.log('🔧 2TDATA-WEB Upload Diagnostics\n');
  
  const results = testUploadSetup();
  
  console.log('\n📊 Summary:');
  console.log(`   Directories: ${Object.values(results).every(v => v) ? '✅ ALL OK' : '❌ ISSUES FOUND'}`);
  
  // Ask user if they want to start debug server
  console.log('\n🤔 Would you like to start a debug server to test uploads? (Y/n)');
  
  // For now, auto-start the debug server
  setTimeout(() => {
    startDebugServer();
  }, 2000);
};

// Export for use in other files
export { testUploadSetup, startDebugServer };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
