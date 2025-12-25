import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SecureStorage } from '../utils/security';
import { getProfile } from '../app/utils/api/user';
import { initializePushNotifications, unregisterPushToken } from '../lib/notifications';

interface User {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userId?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = await SecureStorage.getToken('auth_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Try to load user profile
      try {
        const response = await getProfile(token);
        const userData = response.data;
        setUser({
          id: userData.id || userData.uid || '',
          email: userData.email || '',
          name: userData.name || userData.displayName,
          displayName: userData.displayName || userData.name,
          emailVerified: userData.emailVerified || false,
        });
      } catch (error) {
        // If profile fetch fails, token might be invalid
        console.error('Failed to load user profile:', error);
        await logout();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (token: string, userId?: string) => {
    try {
      await SecureStorage.setToken('auth_token', token);
      if (userId) {
        await SecureStorage.setToken('user_id', userId);
      }
      await loadUser();
      // Initialize push notifications after login
      await initializePushNotifications();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Unregister push token before logout
      await unregisterPushToken();
      await SecureStorage.deleteToken('auth_token');
      await SecureStorage.deleteToken('user_id');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

