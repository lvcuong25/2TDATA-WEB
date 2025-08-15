import axios from 'axios';
import API_URL from '../config/api-config';

/**
 * 🌐 Cookie-Only Authentication Axios Instance
 * 
 * ✅ Chỉ sử dụng HTTP-only cookies cho authentication
 * ✅ Không lưu token trên localStorage/sessionStorage
 * ✅ Bảo mật tốt hơn, chống XSS attacks
 * ✅ Tự động gửi cookies với mọi request
 */

const instance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable cookies to be sent with requests
});

// Request interceptor - không cần thêm Authorization header
// Cookies sẽ được tự động gửi với withCredentials: true
instance.interceptors.request.use((config) => {
  console.log('Cookie-only axios request:', {
    url: config.url,
    method: config.method,
    withCredentials: config.withCredentials,
    cookies: document.cookie
  });
  // Không cần thêm Authorization header vì cookie sẽ được gửi tự động
  // config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor to handle authentication and authorization errors
instance.interceptors.response.use(
  (response) => {
    console.log('Cookie-only axios response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Handle authentication errors (401)
    if (error.response?.status === 401) {
      console.log('401 error detected, user needs to login...');
      console.log('401 error URL:', error.config?.url);
      console.log('401 error current path:', window.location.pathname);
      console.log('401 error response:', error.response?.data);
      
      // Clear user data from localStorage when 401 occurs
      localStorage.removeItem('user');
      localStorage.removeItem('auth_timestamp');
      sessionStorage.removeItem('user');
      
      // Don't redirect for iframe routes to avoid breaking iframe functionality
      const isIframeRoute = error.config?.url?.includes('/iframe/');
      const isAuthRoute = error.config?.url?.includes('/auth/') || error.config?.url?.includes('/auth');
      const isAlreadyOnAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/signin');
      
      // Tránh redirect loop bằng cách kiểm tra kỹ hơn
      if (!isIframeRoute && !isAuthRoute && !isAlreadyOnAuthPage) {
        const currentPath = window.location.pathname + window.location.search;
        console.log('Redirecting to signin with path:', currentPath);
        
        // Thêm delay nhỏ để tránh redirect quá nhanh
        setTimeout(() => {
          window.location.href = `/signin?redirect=${encodeURIComponent(currentPath)}`;
        }, 100);
      } else {
        console.log('Not redirecting - iframe route or auth route or already on signin page');
      }
    }
    
    // Handle authorization errors (403) - specifically USER_INACTIVE
    if (error.response?.status === 403) {
      const errorData = error.response?.data;
      
      // Check if user is inactive
      if (errorData?.error === 'USER_INACTIVE') {
        console.log('User inactive detected...');
        localStorage.removeItem('user');
        localStorage.removeItem('auth_timestamp');
        sessionStorage.removeItem('user');
        
        // Show user-friendly message
        if (typeof window !== 'undefined' && window.toast) {
          window.toast.error('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.');
        }
        
        // Redirect to login page
        const isAlreadyOnAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/signin');
        if (!isAlreadyOnAuthPage) {
          const currentPath = window.location.pathname + window.location.search;
          setTimeout(() => {
            window.location.href = `/signin?redirect=${encodeURIComponent(currentPath)}`;
          }, 100);
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
    throw error.response?.data || error;
  }
};

export const axiosPost = async (url, data) => {
  try {
    const response = await instance.post(url, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const axiosPut = async (url, data) => {
  try {
    const response = await instance.put(url, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const axiosPatch = async (url, data) => {
  try {
    const response = await instance.patch(url, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const axiosDelete = async (url) => {
  try {
    const response = await instance.delete(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default instance;
