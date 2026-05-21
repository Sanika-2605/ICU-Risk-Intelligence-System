import API from './api';

export const getAlerts = async () => {
  const response = await API.get('/alerts');
  return response.data;
};

export const getCriticalAlerts = async () => {
  const response = await API.get('/alerts/critical');
  return response.data;
};
