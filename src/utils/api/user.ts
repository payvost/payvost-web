import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-jpcbatlqpa-uc.a.run.app';

export const register = async (email: string, password: string, name?: string) => {
  return axios.post(`${API_URL}/user/register`, { email, password, name });
};

export const login = async (email: string, password: string) => {
  return axios.post(`${API_URL}/user/login`, { email, password });
};

export const getProfile = async (token: string) => {
  return axios.get(`${API_URL}/user/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateKycStatus = async (token: string, userId: string, kycStatus: string) => {
  return axios.post(`${API_URL}/user/kyc`, { userId, kycStatus }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateUserRole = async (token: string, userId: string, role: string) => {
  return axios.post(`${API_URL}/user/role`, { userId, role }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const requestPasswordReset = async (email: string) => {
  return axios.post(`${API_URL}/user/password-reset/request`, { email });
};

export const confirmPasswordReset = async (email: string, newPassword: string, token: string) => {
  return axios.post(`${API_URL}/user/password-reset/confirm`, { email, newPassword, token });
};
