import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.id) config.headers['x-user-id'] = user.id;
  } catch { /* ignore */ }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginUser = (email, password) =>
  api.post('/api/auth/login', { email, password });

// ── Patients ──────────────────────────────────────────────────────────────────
export const getPatients = () => api.get('/api/patients');
export const getPatient  = (id) => api.get(`/api/patients/${id}`);
export const createPatient = (data) => api.post('/api/patients', data);

// ── Predict ───────────────────────────────────────────────────────────────────
export const runPrediction        = (data) => api.post('/api/predict', data);
export const getPredictionHistory = (patientId) =>
  api.get(`/api/predictions/${patientId}`);

// ── Interventions ─────────────────────────────────────────────────────────────
export const createIntervention = (data) => api.post('/api/interventions', data);
export const getInterventions   = (patientId) =>
  api.get('/api/interventions', { params: { patient_id: patientId } });

// ── Nurse Tasks ───────────────────────────────────────────────────────────────
export const getNurseTasks   = () => api.get('/api/nurse-tasks');
export const updateNurseTask = (taskId, data) =>
  api.put(`/api/nurse-tasks/${taskId}`, data);

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAdminStats = () => api.get('/api/admin/stats');

// ── Admin Users ───────────────────────────────────────────────────────────────
export const getAdminUsers = () => api.get('/api/admin/users');

// ── Health ────────────────────────────────────────────────────────────────────
export const checkHealth = () => api.get('/api/health');
