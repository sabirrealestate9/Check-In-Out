import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ error: string }>) => {
    const message = error.response?.data?.error || 'An error occurred';
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getMe: () =>
    api.get('/auth/me'),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  
  getUsers: () =>
    api.get('/auth/users'),
  
  createUser: (data: { email: string; password: string; fullName: string; role: string }) =>
    api.post('/auth/users', data),
  
  updateUser: (id: number, data: { fullName?: string; role?: string; isActive?: boolean }) =>
    api.put(`/auth/users/${id}`, data),
  
  deleteUser: (id: number) =>
    api.delete(`/auth/users/${id}`),
};

// Tenant API
export const tenantAPI = {
  getAll: (params?: { status?: string; studioId?: string; search?: string }) =>
    api.get('/tenants', { params }),
  
  getById: (id: number) =>
    api.get(`/tenants/${id}`),
  
  create: (data: {
    fullName: string;
    passportId?: string;
    contactNumber?: string;
    email?: string;
    studioId: number;
    checkInDate: string;
    checkOutDate: string;
  }) => api.post('/tenants', data),
  
  update: (id: number, data: Partial<{
    fullName: string;
    passportId: string;
    contactNumber: string;
    email: string;
    studioId: number;
    checkInDate: string;
    checkOutDate: string;
    status: string;
  }>) => api.put(`/tenants/${id}`, data),
  
  checkout: (id: number) =>
    api.post(`/tenants/${id}/checkout`),
  
  delete: (id: number) =>
    api.delete(`/tenants/${id}`),
};

// Checklist API
export const checklistAPI = {
  getAll: (params?: { tenantId?: string; checklistType?: string }) =>
    api.get('/checklists', { params }),
  
  getById: (id: number) =>
    api.get(`/checklists/${id}`),
  
  create: (data: FormData) =>
    api.post('/checklists', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  update: (id: number, data: Partial<{
    furnitureCondition: string;
    appliancesCondition: string;
    wallsPaintCondition: string;
    acCondition: string;
    utilitiesStatus: string;
    cleanlinessStatus: string;
    additionalNotes: string;
  }>) => api.put(`/checklists/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/checklists/${id}`),
};

// Studio API
export const studioAPI = {
  getAll: () =>
    api.get('/studios'),
  
  getById: (id: number) =>
    api.get(`/studios/${id}`),
  
  create: (data: { name: string; address?: string; description?: string }) =>
    api.post('/studios', data),
  
  update: (id: number, data: Partial<{ name: string; address: string; description: string; isActive: boolean }>) =>
    api.put(`/studios/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/studios/${id}`),
};

// Google Drive API
export const driveAPI = {
  getStatus: () =>
    api.get('/drive/status'),
  
  getStudios: () =>
    api.get('/drive/studios'),
  
  getStudioContents: (folderId: string) =>
    api.get(`/drive/studios/${folderId}/contents`),
  
  getFolderStructure: (folderId: string, maxDepth?: number) =>
    api.get(`/drive/studios/${folderId}/structure`, { params: { maxDepth } }),
  
  getFile: (fileId: string) =>
    api.get(`/drive/files/${fileId}`),
  
  getDownloadUrl: (fileId: string) =>
    api.get(`/drive/files/${fileId}/download`),
  
  syncStudios: () =>
    api.post('/drive/sync-studios'),
  
  search: (query: string) =>
    api.get('/drive/search', { params: { q: query } }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () =>
    api.get('/dashboard/stats'),
  
  getActivity: (limit?: number) =>
    api.get('/dashboard/activity', { params: { limit } }),
  
  getTenantStats: () =>
    api.get('/dashboard/tenant-stats'),
};

// Company Policy API
export const policyAPI = {
  getAll: () =>
    api.get('/policies'),
  
  getById: (id: number) =>
    api.get(`/policies/${id}`),
  
  create: (data: { title: string; content: string; category?: string }) =>
    api.post('/policies', data),
  
  update: (id: number, data: Partial<{ title: string; content: string; category: string; isActive: boolean }>) =>
    api.put(`/policies/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/policies/${id}`),
};

export default api;
