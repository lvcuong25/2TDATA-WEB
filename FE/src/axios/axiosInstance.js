import axios from 'axios';

/**
 * 🌐 Multi-Site Axios Instance
 * 
 * This instance provides:
 * ✅ Dynamic base URL for multi-site support
 * ✅ Automatic authentication token handling
 * ✅ Proper CORS handling without forbidden headers
 * ✅ Compatible with localhost development and custom domains
 */

// Create axios instance with dynamic base configuration for multi-site support
const getApiBaseURL = () => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/api`;
};

const axiosInstance = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Debug logging for all requests
    
    // Don't add token for public endpoints
    const publicEndpoints = ['/auth/sign-in', '/auth/sign-up', '/auth/send-otp', '/auth/reset-password'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url.includes(endpoint));
    
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Handle multipart/form-data requests
    if (config.data instanceof FormData) {
      // Remove Content-Type header for FormData - let browser set it with boundary
      delete config.headers['Content-Type'];
    }
    
    // ✅ Removed manual X-Host header setting
    // The browser automatically handles Host headers properly for same-origin requests
    // The backend site detection middleware will use the natural Host header
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = '/auth/signin';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
