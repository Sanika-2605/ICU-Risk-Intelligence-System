import api from './api';

export const submitPrediction = async (data) => {
  const response = await api.post('/api/predict', data);
  return response.data;
};

export const getPredictionHistory = async (patientId) => {
  const response = await api.get(`/api/predictions/${patientId}`);
  return response.data;
};

export const getHighRiskPredictions = async () => {
  const response = await api.get('/api/patients');
  const patients = response.data || [];
  const highRisk = patients.filter(
    (p) => p.latest_prediction?.overall_risk === 'HIGH'
  );
  return { predictions: highRisk };
};

export const getAllPredictions = async () => {
  const response = await api.get('/api/patients');
  return { predictions: response.data || [] };
};
