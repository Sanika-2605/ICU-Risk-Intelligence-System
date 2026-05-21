import API from './api';

export const getDoctorDashboard = async () => {
  const response = await API.get('/dashboard/doctor');
  return response.data;
};

export const getNurseDashboard = async () => {
  const response = await API.get('/dashboard/nurse');
  return response.data;
};

export const getAdminDashboard = async () => {
  const response = await API.get('/dashboard/admin');
  return response.data;
};
