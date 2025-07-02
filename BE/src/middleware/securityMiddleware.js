const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { securityLogger, logger } = require('../utils/logger');
const User = require('../model/User');
const Site = require('../model/Site');

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      securityLogger.suspiciousActivity('RATE_LIMIT_EXCEEDED', {
        endpoint: req.path,
        method: req.method,
        limit: max,
        window: windowMs
      }, ip, req.get('User-Agent'));
      
      res.status(429).json({ error: message });
    }
  });
};

// Different rate limiters for different endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts, please try again later'
);

const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many API requests, please try again later'
);

const uploadLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // limit each IP to 10 uploads per windowMs
  'Too many upload attempts, please try again later'
);

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
});

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Check for suspicious patterns in request
  const suspiciousPatterns = [
    /(\<script\>)/gi,
    /(\<\/script\>)/gi,
    /(javascript:)/gi,
    /(on\w+\s*=)/gi,
    /(union\s+select)/gi,
    /(drop\s+table)/gi,
    /(delete\s+from)/gi,
    /(\.\.\/)/, // Path traversal
    /(%2e%2e%2f)/gi, // URL encoded path traversal
  ];
  
  const checkSuspicious = (obj) => {
    if (typeof obj === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkSuspicious(value));
    }
    return false;
  };
  
  if (checkSuspicious(req.body) || checkSuspicious(req.query) || checkSuspicious(req.params)) {
    securityLogger.suspiciousActivity('MALICIOUS_PAYLOAD', {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params
    }, ip, req.get('User-Agent'));
    
    return res.status(400).json({ error: 'Invalid request content' });
  }
  
  next();
};

// Site ID validation middleware
const validateSiteId = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const siteId = req.site?._id || req.params.siteId || req.body.siteId;
    
    if (!siteId) {
      return next(); // Let other middleware handle missing site
    }
    
    // Validate site exists and is active
    const site = await Site.findById(siteId);
    if (!site) {
      securityLogger.accessDenied(req.user?._id, 'site', 'access', siteId, ip);
      return res.status(404).json({ error: 'Site not found' });
    }
    
    if (site.status !== 'active') {
      securityLogger.accessDenied(req.user?._id, 'site', 'access', siteId, ip);
      return res.status(403).json({ error: 'Site is not active' });
    }
    
    // For non-super admins, validate they have access to this site
    if (req.user && !req.user.isSuperAdmin) {
      const hasAccess = await site.isSiteAdmin(req.user._id);
      if (!hasAccess && req.site?._id?.toString() !== siteId.toString()) {
        securityLogger.accessDenied(req.user._id, 'site', 'access', siteId, ip);
        return res.status(403).json({ error: 'Access denied to this site' });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Site validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// User authentication logging middleware
const logAuthentication = (req, res, next) => {
  const originalSend = res.send;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  res.send = function(data) {
    // Log authentication events
    if (req.path.includes('/auth/login') || req.path.includes('/login')) {
      if (res.statusCode === 200) {
        const userId = req.user?._id || (typeof data === 'string' ? JSON.parse(data)?.user?.id : data?.user?.id);
        const siteId = req.site?._id;
        securityLogger.authSuccess(userId, siteId, ip, userAgent);
      } else {
        const email = req.body?.email || 'unknown';
        const reason = typeof data === 'string' ? JSON.parse(data)?.error : data?.error;
        securityLogger.authFailure(email, req.site?._id, ip, userAgent, reason);
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Data access logging middleware
const logDataAccess = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userId = req.user?._id;
  const siteId = req.site?._id;
  
  // Log data access for important operations
  const resourceMap = {
    '/users': 'user',
    '/sites': 'site',
    '/site-admins': 'site_admin',
    '/assets': 'asset',
    '/blogs': 'blog',
    '/iframes': 'iframe',
    '/services': 'service'
  };
  
  const resource = Object.keys(resourceMap).find(path => req.path.includes(path));
  if (resource && userId) {
    const action = req.method.toLowerCase();
    const recordId = req.params.id || req.params.userId || req.params.siteId;
    
    securityLogger.dataAccess(userId, resourceMap[resource], action, recordId, siteId, ip);
  }
  
  next();
};

// Failed login attempt tracking
const loginAttempts = new Map();

const trackFailedLogins = (req, res, next) => {
  const originalSend = res.send;
  const ip = req.ip || req.connection.remoteAddress;
  const email = req.body?.email;
  
  res.send = function(data) {
    if ((req.path.includes('/auth/login') || req.path.includes('/login')) && res.statusCode !== 200) {
      if (email) {
        const key = `${ip}:${email}`;
        const attempts = loginAttempts.get(key) || { count: 0, lastAttempt: Date.now() };
        
        attempts.count += 1;
        attempts.lastAttempt = Date.now();
        loginAttempts.set(key, attempts);
        
        // Log suspicious activity if too many failed attempts
        if (attempts.count >= 5) {
          securityLogger.suspiciousActivity('BRUTE_FORCE_ATTEMPT', {
            email,
            attemptCount: attempts.count,
            timeWindow: '15 minutes'
          }, ip, req.get('User-Agent'));
        }
        
        // Clean up old entries every hour
        if (Date.now() - attempts.lastAttempt > 60 * 60 * 1000) {
          loginAttempts.delete(key);
        }
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Clean up old login attempts periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of loginAttempts.entries()) {
    if (now - attempts.lastAttempt > 60 * 60 * 1000) { // 1 hour
      loginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

module.exports = {
  authLimiter,
  apiLimiter,
  uploadLimiter,
  securityHeaders,
  sanitizeRequest,
  validateSiteId,
  logAuthentication,
  logDataAccess,
  trackFailedLogins
};
