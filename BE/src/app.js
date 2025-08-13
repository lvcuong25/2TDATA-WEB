import express from "express";
import dotenv from 'dotenv';
import router from './router/index.js';
import { connectDB } from "./config/db.js";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from './utils/logger.js';
import { authAndSiteDetectionMiddleware } from './middlewares/authAndSiteDetection.js';
import { applySiteFilterMiddleware } from './middlewares/siteDetection.js';

// Load environment variables
dotenv.config();

const app = express();
const { DB_URI, PORT = 3000 } = process.env;

// Configure basic CORS to avoid database-dependent issues
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow all origins for now
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Host', 'X-Site-Id'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));
app.use('/logos', express.static('uploads/logos'));

// Apply combined auth and site detection middleware
app.use("/api", (req, res, next) => {
    // Skip for certain routes
    const skipRoutes = [
        '/api/health',
        '/api/auth/sign-up',
        '/api/auth/sign-in',
        '/api/auth/send-otp',
        '/api/auth/reset-password',
        '/api/auth', // ← Thêm endpoint /api/auth để Frontend có thể verify user
        '/api/service/check-assign-user'
    ];
    
    if (skipRoutes.some(route => req.path.startsWith(route))) {
        return next();
    }
    
    // Apply auth and site detection
    authAndSiteDetectionMiddleware(req, res, (err) => {
        if (err) return next(err);
        applySiteFilterMiddleware(req, res, next);
    });
});

// Main router
app.use("/api", router);

// 404 handler
app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});

// Error handler
app.use((err, req, res, next) => {
    return res.status(err.status || 500).json({
      name: err.name,
      message: err.message,
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Add a simple health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Start server function
async function startServer() {
  try {
    // Try to connect to database
    if (DB_URI) {
      try {
        await connectDB(DB_URI);
        console.log('✅ Database connected successfully');
      } catch (dbError) {
        console.warn('⚠️ Database connection failed:', dbError.message);
      }
    }
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT}`);
      console.log(`🔗 API available at: http://localhost:${PORT}/api`);
    });
    
    server.on('error', (err) => {
      console.error('❌ Server startup error:', err);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
