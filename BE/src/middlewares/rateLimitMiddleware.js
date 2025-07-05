import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Redis client for rate limiting (optional - falls back to memory)
let redisClient = null;
try {
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
    }
} catch (error) {
  }

/**
 * Create rate limiter for specific endpoints per site
 */
export const createSiteRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Max requests per window
    message = 'Too many requests from this site',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  // Use Redis store if available, otherwise memory
  const store = redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:site:'
  }) : undefined;

  return rateLimit({
    windowMs,
    max,
    message,
    skipSuccessfulRequests,
    skipFailedRequests,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    keyGenerator: (req) => {
      // Rate limit by site + IP combination
      const siteId = req.site?._id || 'unknown';
      const ip = req.ip || req.connection.remoteAddress;
      return `${siteId}:${ip}`;
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests, please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(options.windowMs / 1000)
      });
    }
  });
};

/**
 * Specific rate limiters for different operations
 */

// Auth endpoints - stricter limits
export const authRateLimiter = createSiteRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true // Only count failed attempts
});

// API endpoints - standard limits
export const apiRateLimiter = createSiteRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many API requests, please slow down'
});

// File upload - very strict limits
export const uploadRateLimiter = createSiteRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads, please try again later'
});

// Admin operations - moderate limits
export const adminRateLimiter = createSiteRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Too many admin requests, please slow down'
});

/**
 * Dynamic rate limiter based on user role
 */
export const dynamicRateLimiter = (req, res, next) => {
  let limiter;
  
  // Super admin - more lenient limits
  if (req.user?.role === 'super_admin') {
    limiter = createSiteRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 1000, // Very high limit
      message: 'Rate limit exceeded'
    });
  }
  // Site admin - moderate limits
  else if (req.user?.role === 'site_admin') {
    limiter = createSiteRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 200,
      message: 'Rate limit exceeded for admin operations'
    });
  }
  // Regular users - standard limits
  else {
    limiter = apiRateLimiter;
  }
  
  limiter(req, res, next);
};

/**
 * Per-site configuration override
 */
export const siteSpecificRateLimiter = (req, res, next) => {
  // Check if site has custom rate limit settings
  const siteSettings = req.site?.settings?.rateLimit;
  
  if (siteSettings) {
    const customLimiter = createSiteRateLimiter({
      windowMs: siteSettings.windowMs || 15 * 60 * 1000,
      max: siteSettings.max || 100,
      message: siteSettings.message || 'Too many requests'
    });
    
    return customLimiter(req, res, next);
  }
  
  // Use default rate limiter
  return apiRateLimiter(req, res, next);
};

export default {
  createSiteRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  adminRateLimiter,
  dynamicRateLimiter,
  siteSpecificRateLimiter
};
