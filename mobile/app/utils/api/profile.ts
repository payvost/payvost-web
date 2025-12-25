/**
 * Profile API
 * 
 * API calls for user profile management
 */

import axios from 'axios';
import { SecureStorage } from '../../../utils/security';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  avatar?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

/**
 * Get user profile
 */
export const getProfile = async (): Promise<UserProfile> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${API_URL}/api/v1/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.user || response.data;
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch profile');
  }
};

/**
 * Update user profile
 */
export interface UpdateProfileRequest {
  name?: string;
  displayName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<UserProfile> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.put(
      `${API_URL}/api/v1/user/profile`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.user || response.data;
  } catch (error: any) {
    console.error('Error updating profile:', error);
    throw new Error(error.response?.data?.error || 'Failed to update profile');
  }
};

/**
 * Upload profile avatar
 */
export const uploadAvatar = async (imageUri: string): Promise<{ avatarUrl: string }> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    const response = await axios.post(
      `${API_URL}/api/v1/user/profile/avatar`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    throw new Error(error.response?.data?.error || 'Failed to upload avatar');
  }
};

/**
 * Get KYC status
 */
export const getKycStatus = async () => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${API_URL}/api/v1/user/kyc`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error fetching KYC status:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch KYC status');
  }
};

/**
 * Submit KYC verification
 */
export interface KycSubmission {
  documentType: 'PASSPORT' | 'ID_CARD' | 'DRIVERS_LICENSE';
  documentFront: string; // Base64 or file URI
  documentBack?: string;
  selfie?: string;
}

export const submitKyc = async (data: KycSubmission) => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${API_URL}/api/v1/user/kyc`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error submitting KYC:', error);
    throw new Error(error.response?.data?.error || 'Failed to submit KYC');
  }
};

