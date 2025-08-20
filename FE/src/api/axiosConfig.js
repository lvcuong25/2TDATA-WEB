import axios from 'axios';

/**
 * 🌐 Multi-Site Axios Configuration
 * 
 * ⚠️  DEPRECATED: For new development, consider using:
 *    - ../../BE/frontend-helpers/api-client.js (recommended)
 *    - This provides better site detection and doesn't require manual headers
 * 
 * This configuration has been updated to:
 * ✅ Use dynamic base URL for multi-site support
 * ✅ Work with affiliate domains
 */

// Dynamic base URL function for multi-site support
const getApiBaseURL = () => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/api`;
};

// Create axios instance with dynamic base configuration
const axiosConfig = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable cookies to be sent with requests
});

// Request interceptor - cookies will be sent automatically
axiosConfig.interceptors.request.use(
  (config) => {
    console.log('AxiosConfig request:', {
      url: config.url,
      method: config.method,
      withCredentials: config.withCredentials
    });
    // Cookies will be sent automatically with withCredentials: true
    // No need to manually add Authorization header
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
axiosConfig.interceptors.response.use(
  (response) => {
    console.log('AxiosConfig response:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  (error) => {
    // Handle authentication errors (401)
    if (error.response?.status === 401) {
      console.log('401 error detected, user needs to login...');
      localStorage.removeItem('user');
      
      // Don't redirect for iframe routes to avoid breaking iframe functionality
      const isIframeRoute = error.config?.url?.includes('/iframe/');
      const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
      if (!isIframeRoute && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/signin') && !isHomePage) {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/signin?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    
    // Handle authorization errors (403) - specifically USER_INACTIVE
    if (error.response?.status === 403) {
      const errorData = error.response?.data;
      
      // Check if user is inactive
      if (errorData?.error === 'USER_INACTIVE') {
        console.log('User inactive detected...');
        localStorage.removeItem('user');
        
        // Show user-friendly message
        if (typeof window !== 'undefined' && window.toast) {
          window.toast.error('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.');
        }
        
        // Redirect to login page
        const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signin') && !isHomePage) {
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/signin?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosConfig;
