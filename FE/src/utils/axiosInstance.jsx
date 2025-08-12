import axios from 'axios';
import API_URL from '../config/api-config';

/**
 * 🌐 Multi-Site Axios Utils Instance
 * 
 * ⚠️  DEPRECATED: For new development, consider using:
 *    - ../../BE/frontend-helpers/api-client.js (recommended)
 *    - This provides better site detection and doesn't require manual headers
 * 
 * This instance has been updated to:
 * ✅ Use dynamic base URL for multi-site support
 * ✅ Work with affiliate domains
 */

const instance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable cookies to be sent with requests
});

// Thêm interceptor để tự động gắn token
instance.interceptors.request.use((config) => {
  if (!config.url.includes('/auth/sign-in')) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle authentication and authorization errors
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
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
    
    return Promise.reject(error);
  }
);

export const axiosGet = async (url) => {
  try {
    const response = await instance.get(url);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const axiosPost = async (url, data) => {
  try {
    const response = await instance.post(url, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const axiosPut = async (url, data) => {
  try {
    const response = await instance.put(url, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const axiosPatch = async (url, data) => {
  try {
    const response = await instance.patch(url, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const axiosDelete = async (url) => {
  try {
    const response = await instance.delete(url);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export default instance;
