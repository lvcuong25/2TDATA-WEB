import axios from 'axios';
import API_URL from '../config/api-config';

const instance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log error details for debugging
    console.error('Axios error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message
    });
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Don't redirect for iframe routes
      const isIframeRoute = error.config?.url?.includes('/iframe/');
      
      // Check if we're already on login page to avoid redirect loop
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signin') && !isIframeRoute) {
        console.log('401 error detected, redirecting to login...');
        // Token expired or invalid
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('accessToken');
        // Redirect to login page with current path as redirect param
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/signin?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default instance;
