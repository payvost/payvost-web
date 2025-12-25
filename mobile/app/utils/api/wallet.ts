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

/**
 * Create a new wallet/account
 */
export interface CreateWalletRequest {
  currency: string;
  type?: 'PERSONAL' | 'BUSINESS';
}

export interface CreateWalletResponse {
  account: Wallet;
}

export const createWallet = async (data: CreateWalletRequest): Promise<CreateWalletResponse> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${API_URL}/api/v1/wallet/accounts`,
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
    console.error('Error creating wallet:', error);
    if (error.response?.status === 403) {
      throw new Error('KYC verification required to create wallets');
    }
    throw new Error(error.response?.data?.error || 'Failed to create wallet');
  }
};

/**
 * Fund a wallet (deposit money)
 */
export interface FundWalletRequest {
  accountId: string;
  amount: number;
  currency: string;
  paymentMethod?: 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CRYPTO';
  idempotencyKey?: string;
}

export interface FundWalletResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

export const fundWallet = async (data: FundWalletRequest): Promise<FundWalletResponse> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const idempotencyKey = data.idempotencyKey || `fund-${Date.now()}-${Math.random()}`;

    const response = await axios.post(
      `${API_URL}/api/v1/wallet/deposit`,
      { ...data, idempotencyKey },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error funding wallet:', error);
    throw new Error(error.response?.data?.error || 'Failed to fund wallet');
  }
};

/**
 * Withdraw from wallet
 */
export interface WithdrawWalletRequest {
  accountId: string;
  amount: number;
  currency: string;
  destination: {
    type: 'BANK_ACCOUNT' | 'MOBILE_MONEY' | 'CRYPTO';
    accountNumber?: string;
    bankCode?: string;
    mobileNumber?: string;
    cryptoAddress?: string;
  };
  idempotencyKey?: string;
}

export interface WithdrawWalletResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

export const withdrawFromWallet = async (data: WithdrawWalletRequest): Promise<WithdrawWalletResponse> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const idempotencyKey = data.idempotencyKey || `withdraw-${Date.now()}-${Math.random()}`;

    const response = await axios.post(
      `${API_URL}/api/v1/wallet/withdraw`,
      { ...data, idempotencyKey },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error withdrawing from wallet:', error);
    throw new Error(error.response?.data?.error || 'Failed to withdraw from wallet');
  }
};

/**
 * Get wallet details with ledger entries
 */
export const getWalletDetails = async (walletId: string) => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(
      `${API_URL}/api/v1/wallet/accounts/${walletId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error fetching wallet details:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch wallet details');
  }
};

/**
 * Get ledger entries for a wallet
 */
export const getWalletLedger = async (walletId: string, limit = 50, offset = 0) => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(
      `${API_URL}/api/v1/wallet/accounts/${walletId}/ledger`,
      {
        params: { limit, offset },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error fetching wallet ledger:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch wallet ledger');
  }
};

