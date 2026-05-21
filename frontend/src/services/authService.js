import API from './api';

export const loginUser = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (data) => {
  const response = await API.post('/auth/register', data);
  return response.data;
};
