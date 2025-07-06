/**
 * 🌐 Multi-Site Environment Configuration
 * 
 * ✅ Updated to support dynamic API base URLs for affiliate domains
 * ✅ Works with localhost, techhub.localhost, finance.localhost, etc.
 */

// Dynamic API base URL function for multi-site support
const getApiBaseURL = () => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/api`;
};

// Dynamic configuration based on current domain
const config = {
  // Dynamic API base URL that works with affiliate domains
  apiBaseURL: getApiBaseURL(),
  
  // Static services that are always on localhost
  mongoExpressURL: 'http://localhost:8081',
  
  // Helper functions
  getCurrentDomain: () => window.location.hostname,
  isAffiliateDomain: () => {
    const hostname = window.location.hostname;
    return hostname !== 'localhost' && hostname !== '127.0.0.1';
  }
};

// Log current configuration for debugging
// Configuration logging removed

export default config;
