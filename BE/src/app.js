import express from "express";
import dotenv from 'dotenv';
import router from './router/index.js';
import { connectDB } from "./config/db.js";
import dynamicCors from './middlewares/corsMiddleware.js';
// Site detection middleware for multi-tenant functionality
import { 
  detectSiteMiddleware, 
  applySiteFilterMiddleware,
  checkSuperAdminMiddleware,
  checkSiteAdminMiddleware 
} from './middlewares/siteDetection.js';
// import {
//   rateLimitMiddleware,
//   securityHeadersMiddleware,
//   inputSanitizationMiddleware,
//   auditMiddleware,
//   bruteForceMiddleware
// } from './middlewares/securityMiddleware.js';
import logger from './utils/logger.js';

// import router from './router';

const app = express();
dotenv.config();

// Use dynamic CORS based on site domains
app.use(dynamicCors);

const { DB_URI, PORT } = process.env;
connectDB(process.env.DB_URI);
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));
// Serve logos directly at /logos/ for frontend compatibility
app.use('/logos', express.static('uploads/logos'));

// Site detection and filtering middlewares
app.use('/api', detectSiteMiddleware);
// app.use('/api', applySiteFilterMiddleware);
// app.use('/api', checkSuperAdminMiddleware);
// app.use('/api', checkSiteAdminMiddleware);

// Security Middleware
// app.use(rateLimitMiddleware);
// app.use(securityHeadersMiddleware);
// app.use(inputSanitizationMiddleware);
// app.use(auditMiddleware);
// app.use(bruteForceMiddleware);

// Main router
app.use("/api", router);

app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
  });
  
  app.use((err, req, res, next) => {
    return res.status(500).json({
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

app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
  }).on('error', (err) => {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  });

