import axios from 'axios';

// Detecta si estamos en producción (Netlify) o desarrollo (Local)
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Crea una instancia de Axios configurada
const api = axios.create({
  baseURL: API_URL,
});

export default api;