import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const documentsAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/upload', formData);
  },
  list: () => api.get('/documents/'),
  get: (id) => api.get(`/documents/${id}`),
  delete: (id) => api.delete(`/documents/${id}`),
};

export const queryAPI = {
  process: (data) => api.post('/query/', data),
  processDocumentQuery: (data) => api.post('/query/document', data),
  history: (limit = 10) => api.get(`/query/history?limit=${limit}`),
};

export const logsAPI = {
  agents: (limit = 50, agentType = null) => {
    const params = { limit };
    if (agentType) params.agent_type = agentType;
    return api.get('/logs/agents', { params });
  },
};

export default api;
