import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  // Base URL is the Next/Functions API; individual calls can override
  baseURL: process.env.NEXT_PUBLIC_API_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Firebase ID token when available
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      if (idToken) {
        // ensure headers exist and are writable
        if (!config.headers) {
          // assign a plain object so we can set Authorization
          (config as any).headers = {};
        }
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${idToken}`;
      }
    }
  } catch (e) {
    // ignore token errors and proceed without auth header
  }
  return config;
});

export default api;
