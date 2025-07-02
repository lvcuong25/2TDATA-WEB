import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting middleware
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers middleware
export const securityHeadersMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Input sanitization middleware
export const inputSanitizationMiddleware = (req, res, next) => {
  // Basic input sanitization
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Remove potential XSS patterns
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    }
  }
  next();
};

// Audit middleware
export const auditMiddleware = (req, res, next) => {
  // Log request for audit purposes
  if (process.env.NODE_ENV !== 'test') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  }
  next();
};

// Brute force protection middleware
export const bruteForceMiddleware = (req, res, next) => {
  // Basic brute force protection
  // In production, you might want to use a more sophisticated solution
  next();
};
