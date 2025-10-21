import api from '../../lib/apiClient';
import { auth, signInWithCustomToken } from '../../lib/firebase';

export const register = async (email: string, password: string, name?: string) => {
  return api.post(`/user/register`, { email, password, name });
};

export const login = async (email: string, password: string) => {
  // Server expects `credential` (email or username). Send email as `credential` to match backend.
  const resp = await api.post(`/user/login`, { credential: email, password });

  // Backend returns a Firebase custom token. Exchange it for a Firebase ID token using the client SDK.
  const customToken = resp.data?.token;
  if (!customToken) return resp; // fallback: return raw response if token missing

  // Sign in with the custom token and obtain an ID token
  await signInWithCustomToken(auth, customToken);
  const currentUser = auth.currentUser;
  const idToken = currentUser ? await currentUser.getIdToken() : null;

  return { customToken, idToken, user: currentUser };
};

export const getProfile = async () => {
  return api.get(`/user/profile`);
};

export const updateKycStatus = async (userId: string, kycStatus: string) => {
  return api.post(`/user/kyc`, { userId, kycStatus });
};

export const updateUserRole = async (userId: string, role: string) => {
  return api.post(`/user/role`, { userId, role });
};

export const requestPasswordReset = async (email: string) => {
  return api.post(`/user/password-reset/request`, { email });
};

export const confirmPasswordReset = async (email: string, newPassword: string, token: string) => {
  return api.post(`/user/password-reset/confirm`, { email, newPassword, token });
};
