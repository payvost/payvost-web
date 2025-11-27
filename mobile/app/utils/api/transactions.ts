import axios from 'axios';
import { SecureStorage } from '../security';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export interface Transaction {
  id: string;
  userId: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  currency: string;
  type: 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL' | 'DEPOSIT' | 'REMITTANCE';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const getTransactions = async (limit = 10, offset = 0): Promise<Transaction[]> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${API_URL}/api/v1/transaction/transfers`, {
      params: {
        limit,
        offset,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.transfers || [];
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    if (error.response?.status === 401) {
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(error.response?.data?.error || 'Failed to fetch transactions');
  }
};

export const getTransactionById = async (transactionId: string): Promise<Transaction> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${API_URL}/api/v1/transaction/transfers/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.transfer;
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch transaction');
  }
};

