import cors from 'cors';
import Site from '../model/Site.js';
import logger from '../utils/logger.js';

/**
 * Cache for site domains to avoid repeated DB queries
 */
const domainCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (reduced for testing)

// Get fallback domains from environment variables
function getFallbackDomains() {
  const envDomains = process.env.ALLOWED_DOMAINS || 'trunglq8.com,test.2tdata.com';
  const domains = envDomains.split(',').map(domain => domain.trim());
  
  const fallbackDomains = [];
  domains.forEach(domain => {
    fallbackDomains.push(`http://${domain}`);
    fallbackDomains.push(`https://${domain}`);
  });
  
  return fallbackDomains;
}

/**
 * Get all allowed domains from database
 */
async function getAllowedDomains() {
  const cached = domainCache.get('all_domains');
  
  if (cached && cached.expires > Date.now()) {
    return cached.domains;
  }
  
  try {
    // Add timeout to prevent hanging
    const sites = await Site.find({ status: 'active' }, 'domains')
      .lean()
      .maxTimeMS(2000); // 2 second timeout
    
    const allDomains = sites.flatMap(site => site.domains || []);
    const allowedDomains = [];
    
    allDomains.forEach(domain => {
      allowedDomains.push(`http://${domain}`);
      allowedDomains.push(`https://${domain}`);
    });
    
    // Always include fallback domains
    const fallbackDomains = getFallbackDomains();
    const finalDomains = [...new Set([...allowedDomains, ...fallbackDomains])];
    
    // Cache the result
    domainCache.set('all_domains', {
      domains: finalDomains,
      expires: Date.now() + CACHE_TTL
    });
    
    logger?.info(`✅ Loaded ${finalDomains.length} allowed domains from database`);
    return finalDomains;
    
  } catch (error) {
    logger?.error('❌ Error fetching allowed domains, using fallback:', error.message);
    
    const fallbackDomains = getFallbackDomains();
    // Cache fallback domains for shorter time
    domainCache.set('all_domains', {
      domains: fallbackDomains,
      expires: Date.now() + (30 * 1000) // 30 seconds
    });
    
    return fallbackDomains;
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
