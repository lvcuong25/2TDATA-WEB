import cors from 'cors';
import Site from '../model/Site.js';

/**
 * Cache for site domains to avoid repeated DB queries
 */
const domainCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Get all allowed domains from database
 */
async function getAllowedDomains() {
  const cached = domainCache.get('all_domains');
  
  if (cached && cached.expires > Date.now()) {
    return cached.domains;
  }
  
  try {
    const sites = await Site.find({ status: 'active' }, 'domains').lean();
    const allDomains = sites.flatMap(site => site.domains);
    
    // Simple domain list with http/https variations only
    const allowedDomains = [];
    allDomains.forEach(domain => {
      allowedDomains.push(`http://${domain}`);
      allowedDomains.push(`https://${domain}`);
    });
    
    // Cache the result
    domainCache.set('all_domains', {
      domains: allowedDomains,
      expires: Date.now() + CACHE_TTL
    });
    
    return allowedDomains;
  } catch (error) {
    console.error('Error fetching allowed domains:', error);
    // Fallback to basic domains
    return [
      'http://localhost',
      'https://localhost'
    ];
  }
}

/**
 * Dynamic CORS configuration based on sites
 */
export const dynamicCors = async (req, res, next) => {
  try {
    const allowedDomains = await getAllowedDomains();
    
    const corsOptions = {
      origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
          return callback(null, true);
        }
        
        // Check if origin is in allowed domains
        if (allowedDomains.includes(origin)) {
          callback(null, true);
        } else {
          // Check if origin matches any domain pattern
          const isAllowed = allowedDomains.some(domain => {
            if (domain.includes('*')) {
              // Handle wildcard domains
              const pattern = domain.replace(/\*/g, '.*');
              return new RegExp(pattern).test(origin);
            }
            return origin === domain || origin.startsWith(domain);
          });
          
          if (isAllowed) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Host', 'X-Site-Id'],
      exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
      maxAge: 86400 // 24 hours
    };
    
    cors(corsOptions)(req, res, next);
  } catch (error) {
    console.error('CORS middleware error:', error);
    // Fallback to basic CORS
    cors({
      origin: true,
      credentials: true
    })(req, res, next);
  }
};

/**
 * Clear domain cache when sites are updated
 */
export const clearDomainCache = () => {
  domainCache.clear();
};

export default dynamicCors;
