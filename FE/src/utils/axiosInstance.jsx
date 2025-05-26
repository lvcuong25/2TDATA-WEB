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