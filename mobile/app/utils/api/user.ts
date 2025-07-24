import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/user';

export const register = async (email: string, password: string, name?: string) => {
  return axios.post(`${API_URL}/register`, { email, password, name });
};

export const login = async (email: string, password: string) => {
  return axios.post(`${API_URL}/login`, { email, password });
};

export const getProfile = async (token: string) => {
  return axios.get(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateKycStatus = async (token: string, userId: string, kycStatus: string) => {
  return axios.post(`${API_URL}/kyc`, { userId, kycStatus }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateUserRole = async (token: string, userId: string, role: string) => {
  return axios.post(`${API_URL}/role`, { userId, role }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const requestPasswordReset = async (email: string) => {
  return axios.post(`${API_URL}/password-reset/request`, { email });
};

export const confirmPasswordReset = async (email: string, newPassword: string, token: string) => {
  return axios.post(`${API_URL}/password-reset/confirm`, { email, newPassword, token });
};
