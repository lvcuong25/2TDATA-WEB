import axiosConfig from './axiosConfig';

// API helper functions
export const api = {
  // Authentication
  auth: {
    signIn: (credentials) => axiosConfig.post('/auth/sign-in', credentials),
    signUp: (userData) => axiosConfig.post('/auth/sign-up', userData),
    sendOTP: (email) => axiosConfig.post('/auth/send-otp', { email }),
    resetPassword: (data) => axiosConfig.post('/auth/reset-password', data),
    changePassword: (data) => axiosConfig.post('/auth/change-password', data),
    getCurrentUser: () => axiosConfig.get('/auth/'),
  },

  // Sites
  sites: {
    getAll: (params) => axiosConfig.get('/sites', { params }),
    getById: (id) => axiosConfig.get(`/sites/${id}`),
    create: (data) => axiosConfig.post('/sites', data),
    update: (id, data) => axiosConfig.put(`/sites/${id}`, data),
    delete: (id) => axiosConfig.delete(`/sites/${id}`),
  },

  // Site Admins
  siteAdmins: {
    getAll: (params) => axiosConfig.get('/site-admins', { params }),
    getBySite: (siteId) => axiosConfig.get(`/site-admins/site/${siteId}`),
    getMyRoles: () => axiosConfig.get('/site-admins/my-admin-roles'),
    assign: (data) => axiosConfig.post('/site-admins', data),
    update: (id, data) => axiosConfig.put(`/site-admins/${id}`, data),
    remove: (id) => axiosConfig.delete(`/site-admins/${id}`),
  },

  // Users
  users: {
    getAll: (params) => axiosConfig.get('/user', { params }),
    getById: (id) => axiosConfig.get(`/user/${id}`),
    create: (data) => axiosConfig.post('/user', data),
    update: (id, data) => axiosConfig.put(`/user/${id}`, data),
    delete: (id) => axiosConfig.delete(`/user/${id}`),
    updateProfile: (data) => axiosConfig.put('/user/profile', data),
  },

  // Services
  services: {
    getAll: (params) => axiosConfig.get('/service', { params }),
    getById: (id) => axiosConfig.get(`/service/${id}`),
    create: (data) => axiosConfig.post('/service', data),
    update: (id, data) => axiosConfig.put(`/service/${id}`, data),
    delete: (id) => axiosConfig.delete(`/service/${id}`),
  },

  // Blogs
  blogs: {
    getAll: (params) => axiosConfig.get('/blogs', { params }),
    getById: (id) => axiosConfig.get(`/blogs/${id}`),
    create: (data) => axiosConfig.post('/blogs', data),
    update: (id, data) => axiosConfig.put(`/blogs/${id}`, data),
    delete: (id) => axiosConfig.delete(`/blogs/${id}`),
  },

  // Assets
  assets: {
    getAll: (params) => axiosConfig.get('/assets', { params }),
    getById: (id) => axiosConfig.get(`/assets/${id}`),
    create: (data) => axiosConfig.post('/assets', data),
    update: (id, data) => axiosConfig.put(`/assets/${id}`, data),
    delete: (id) => axiosConfig.delete(`/assets/${id}`),
  },
};

export default api;
