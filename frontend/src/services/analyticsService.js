import API from './api';

export const getRiskDistribution = async () => {
  const response = await API.get('/analytics/risk-distribution');
  return response.data;
};

export const getPatientTrends = async () => {
  const response = await API.get('/analytics/patient-trends');
  return response.data;
};
