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
    
    // Handle authentication errors (401)
    if (error.response?.status === 401) {
      console.log('401 error detected, clearing auth data...');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
      
      // Don't redirect for iframe routes to avoid breaking iframe functionality
      const isIframeRoute = error.config?.url?.includes('/iframe/');
      if (!isIframeRoute && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/signin')) {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/signin?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    
    // Handle authorization errors (403) - specifically USER_INACTIVE
    if (error.response?.status === 403) {
      const errorData = error.response?.data;
      
      // Check if user is inactive
      if (errorData?.error === 'USER_INACTIVE') {
        console.log('User inactive detected, clearing auth data...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('accessToken');
        
        // Show user-friendly message
        if (typeof window !== 'undefined' && window.toast) {
          window.toast.error('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.');
        }
        
        // Redirect to login page
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signin')) {
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

export default instance;
