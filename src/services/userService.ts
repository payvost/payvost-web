/**
 * User Service
 * 
 * Handles user lookup and profile operations
 */

import { db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';

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
      const identifierTrimmed = identifier.trim().replace('@', '');
      
      // Check if it's an email
      const isEmail = identifier.includes('@');
      
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where(isEmail ? 'email' : 'username', '==', isEmail ? identifier : identifierTrimmed),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const userDoc = querySnapshot.docs[0];
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
};

