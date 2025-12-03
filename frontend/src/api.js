import axios from 'axios';

// Detecta si estamos en producción (Netlify) o desarrollo (Local)
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Crea una instancia de Axios configurada
const api = axios.create({
  baseURL: API_URL,
});

// --- INTERCEPTOR DE SEGURIDAD ---
// Antes de enviar cualquier petición, revisamos si hay un token guardado
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Si existe, lo agregamos en la cabecera Authorization
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;