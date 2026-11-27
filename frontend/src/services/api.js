import axios from 'axios';

// Relative URL to satisfy course requirement
const api = axios.create({
  baseURL: '/api'
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
