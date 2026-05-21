import API from './api';

export const submitPrediction = async (data) => {
  const response = await API.post('/predict', data);
  return response.data;
};

export const getAllPredictions = async () => {
  const response = await API.get('/predictions');
  return response.data;
};

export const getHighRiskPredictions = async () => {
  const response = await API.get('/predictions/high-risk');
  return response.data;
};
