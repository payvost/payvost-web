import axios from 'axios';
import { SecureStorage } from '../../../utils/security';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  type: 'PERSONAL' | 'BUSINESS';
  createdAt: string;
  updatedAt: string;
}

export const getWallets = async (): Promise<Wallet[]> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${API_URL}/api/v1/wallet/accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.accounts || [];
  } catch (error: any) {
    console.error('Error fetching wallets:', error);
    if (error.response?.status === 401) {
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(error.response?.data?.error || 'Failed to fetch wallets');
  }
};

export const getWalletBalance = async (walletId: string): Promise<number> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${API_URL}/api/v1/wallet/accounts/${walletId}/balance`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return parseFloat(response.data.balance || '0');
  } catch (error: any) {
    console.error('Error fetching wallet balance:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch wallet balance');
  }
};

