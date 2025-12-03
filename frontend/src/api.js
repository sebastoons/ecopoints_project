import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor (NUEVO)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend devuelve 401 (No autorizado), limpiamos sesión
    if (error.response && error.response.status === 401) {
      sessionStorage.clear();
      window.location.href = '/'; // Redirección forzada al login
    }
    return Promise.reject(error);
  }
);

export default api;