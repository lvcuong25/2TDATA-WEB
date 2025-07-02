import express from "express";
import dotenv from 'dotenv';
import router from './router/index.js';
import cors from "cors";
import { connectDB } from "./config/db.js";
import { 
  detectSiteMiddleware, 
  applySiteFilterMiddleware,
  checkSuperAdminMiddleware,
  checkSiteAdminMiddleware 
} from './middlewares/siteDetection.js';
import {
  rateLimitMiddleware,
  securityHeadersMiddleware,
  inputSanitizationMiddleware,
  auditMiddleware,
  bruteForceMiddleware
} from './middlewares/securityMiddleware.js';

// Load test environment variables
dotenv.config({ path: '.env.test' });

const app = express();
app.use(cors());

// Connect to test database
if (process.env.NODE_ENV === 'test') {
  // Database connection is handled by test setup
} else {
  connectDB(process.env.MONGODB_URI);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Site detection and filtering middlewares (disabled in test)
if (process.env.NODE_ENV !== 'test') {
  app.use('/api', detectSiteMiddleware);
  app.use('/api', applySiteFilterMiddleware);
  app.use('/api', checkSuperAdminMiddleware);
  app.use('/api', checkSiteAdminMiddleware);
}

// Security Middleware (minimal in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(rateLimitMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(inputSanitizationMiddleware);
  app.use(auditMiddleware);
  app.use(bruteForceMiddleware);
}

// Health check endpoint for testing
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Main router
app.use("/api", router);

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  return res.status(err.status || 500).json({
    name: err.name || 'Error',
    message: err.message || 'Internal Server Error',
  });
});

export default app;
