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

  // Database Management
  database: {
    // Database operations
    getAllDatabases: (params) => axiosConfig.get('/database/databases', { params }),
    getDatabaseById: (id) => axiosConfig.get(`/database/databases/${id}`),
    createDatabase: (data) => axiosConfig.post('/database/databases', data),
    updateDatabase: (id, data) => axiosConfig.put(`/database/databases/${id}`, data),
    deleteDatabase: (id) => axiosConfig.delete(`/database/databases/${id}`),
    
    // Table operations
    getTablesByDatabase: (databaseId) => axiosConfig.get(`/database/databases/${databaseId}/tables`),
    getTableById: (id) => axiosConfig.get(`/database/tables/${id}`),
    createTable: (data) => axiosConfig.post('/database/tables', data),
    updateTable: (id, data) => axiosConfig.put(`/database/tables/${id}`, data),
    deleteTable: (id) => axiosConfig.delete(`/database/tables/${id}`),
    getTableStructure: (id) => axiosConfig.get(`/database/tables/${id}/structure`),
    
    // Column operations
    getColumnsByTable: (tableId) => axiosConfig.get(`/database/tables/${tableId}/columns`),
    getColumnById: (id) => axiosConfig.get(`/database/columns/${id}`),
    createColumn: (data) => axiosConfig.post('/database/columns', data),
    updateColumn: (id, data) => axiosConfig.put(`/database/columns/${id}`, data),
    deleteColumn: (id) => axiosConfig.delete(`/database/columns/${id}`),
    
    // Record operations
    getRecordsByTable: (tableId, params) => axiosConfig.get(`/database/tables/${tableId}/records`, { params }),
    getRecordById: (id) => axiosConfig.get(`/database/records/${id}`),
    createRecord: (data) => axiosConfig.post('/database/records', data),
    updateRecord: (id, data) => axiosConfig.put(`/database/records/${id}`, data),
    deleteRecord: (id) => axiosConfig.delete(`/database/records/${id}`),
  },
