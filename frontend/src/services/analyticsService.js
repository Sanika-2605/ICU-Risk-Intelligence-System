import api from './api';

export const getRiskDistribution = async () => {
  const response = await api.get('/api/admin/stats');
  return response.data?.risk_breakdown || { high: 0, medium: 0, low: 0 };
};

export const getPatientTrends = async () => {
  return [];
};
