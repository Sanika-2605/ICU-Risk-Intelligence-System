import api from './api';

export const getAllPatients = async () => {
  const response = await api.get('/api/patients');
  return response.data;
};

export const getPatient = async (id) => {
  const response = await api.get(`/api/patients/${id}`);
  return response.data;
};

export const addPatient = async (data) => {
  const response = await api.post('/api/patients', data);
  return response.data;
};

export const updatePatient = async (id, data) => {
  const response = await api.put(`/api/patients/${id}`, data);
  return response.data;
};
