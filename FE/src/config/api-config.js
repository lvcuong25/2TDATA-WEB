// Dynamic API URL configuration
const getApiUrl = () => {
  // If accessing from localhost (development on local machine)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3004/api';
  }
  
  // If accessing from any other domain (production/staging)
  // Use relative URL so it goes through Nginx proxy
  return '/api';
};

export const API_URL = getApiUrl();
export default API_URL;
