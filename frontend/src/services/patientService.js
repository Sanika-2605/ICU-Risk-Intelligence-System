import API from './api';

export const getAllPatients = async () => {
  const response = await API.get('/patient/all');
  return response.data;
};

export const getPatient = async (id) => {
  const response = await API.get(`/patient/${id}`);
  return response.data;
};

export const addPatient = async (data) => {
  const response = await API.post('/patient/add', data);
  return response.data;
};

export const updatePatient = async (id, data) => {
  const response = await API.put(`/patient/update/${id}`, data);
  return response.data;
};
