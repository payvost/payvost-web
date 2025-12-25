/**
 * Notifications API
 * 
 * API calls for managing push notification tokens and preferences
 */

import axios from 'axios';
import { SecureStorage } from '../../../utils/security';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Register push notification token with backend
 */
export const registerPushToken = async (token: string, platform: string) => {
  try {
    const authToken = await SecureStorage.getToken('auth_token');
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${API_URL}/api/v1/user/push-token`,
      { token, platform },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error registering push token:', error);
    throw new Error(error.response?.data?.error || 'Failed to register push token');
  }
};

/**
 * Unregister push notification token
 */
export const unregisterPushToken = async () => {
  try {
    const authToken = await SecureStorage.getToken('auth_token');
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    await axios.delete(`${API_URL}/api/v1/user/push-token`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  } catch (error: any) {
    console.error('Error unregistering push token:', error);
    throw new Error(error.response?.data?.error || 'Failed to unregister push token');
  }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async () => {
  try {
    const authToken = await SecureStorage.getToken('auth_token');
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${API_URL}/api/v1/user/notification-preferences`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error getting notification preferences:', error);
    throw new Error(error.response?.data?.error || 'Failed to get notification preferences');
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (preferences: {
  push?: boolean;
  email?: boolean;
  sms?: boolean;
  transactionAlerts?: boolean;
  marketing?: boolean;
}) => {
  try {
    const authToken = await SecureStorage.getToken('auth_token');
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const response = await axios.put(
      `${API_URL}/api/v1/user/notification-preferences`,
      preferences,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    throw new Error(error.response?.data?.error || 'Failed to update notification preferences');
  }
};

