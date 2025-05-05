import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000/api/',
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

export default instance;