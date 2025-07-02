import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/db.js';
import { detectSiteMiddleware } from './src/middlewares/siteDetection.js';

const app = express();

// Connect to database
console.log('🔗 Connecting to database...');
await connectDB();
console.log('✅ Database connected');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://site1.localhost:3000', 'http://techhub.localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Host'],
  credentials: true
}));
app.use(express.json());

// Test endpoint with site detection
app.get('/test-site-detection', detectSiteMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Site detection working!',
    detected_site: {
      id: req.site?._id,
      name: req.site?.name,
      domains: req.site?.domains,
      status: req.site?.status
    },
    request_info: {
      hostname: req.hostname,
      host_header: req.get('host'),
      x_host_header: req.get('x-host'),
      original_url: req.originalUrl,
      path: req.path,
      domain: req.domain,
      is_development: req.isDevelopment
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log('🧪 Test endpoints:');
  console.log('  - http://localhost:3001/test-site-detection (main site)');
  console.log('  - http://site1.localhost:3001/test-site-detection (affiliate)');
  console.log('  - curl -H "Host: site1.localhost" http://localhost:3001/test-site-detection');
  console.log('  - curl -H "Host: techhub.localhost" http://localhost:3001/test-site-detection');
  console.log('');
  console.log('💡 Add these to your hosts file if not already present:');
  console.log('     127.0.0.1 site1.localhost');
  console.log('     127.0.0.1 techhub.localhost');
});
