/**
 * User Service
 * 
 * Handles user lookup and profile operations
 */

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  username?: string;
  email?: string;
  fullName?: string;
  photoURL?: string;
  isVerified?: boolean;
  kycStatus?: string;
  country?: string;
  countryCode?: string;
}

export const userService = {
  /**
   * Lookup user by username or email
   */
  async lookupUser(identifier: string): Promise<UserProfile | null> {
    try {
      const { apiClient } = await import('./apiClient');
      const response = await apiClient.post<{ user: any | null }>('/api/user/lookup', { identifier });
      const userData = response.user;
      if (!userData) return null;

      return {
        uid: userData.uid,
        username: userData.username,
        email: userData.email,
        fullName: userData.fullName,
        photoURL: userData.photoURL,
        isVerified: !!userData.isVerified,
        kycStatus: userData.kycStatus,
        country: userData.country,
        countryCode: userData.countryCode,
      };
    } catch (error) {
      console.error('Error looking up user:', error);
      return null;
    }
  },

  /**
   * Get user profile by UID
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();

      return {
        uid: userDoc.id,
        username: userData.username,
        email: userData.email,
        fullName: userData.fullName || userData.name,
        photoURL: userData.photoURL || userData.photo,
        isVerified: userData.isVerified || userData.kycStatus === 'Verified',
        kycStatus: userData.kycStatus,
        country: userData.country,
        countryCode: userData.countryCode,
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  /**
   * List all users (potential recipients)
   */
  async listUsers(): Promise<UserProfile[]> {
    try {
      const { apiClient } = await import('./apiClient');
      const response = await apiClient.get<{ customers: any[] }>('/api/user');
      return response.customers.map(c => ({
        uid: c.id,
        username: c.email.split('@')[0], // Fallback username
        email: c.email,
        fullName: c.name,
        kycStatus: c.kycStatus,
        country: c.country,
        countryCode: c.countryCode,
      }));
    } catch (error) {
      console.error('Error listing users:', error);
      return [];
    }
  }
};

