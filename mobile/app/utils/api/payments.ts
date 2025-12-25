/**
 * Payments API
 * 
 * API calls for money transfers, airtime, bills, gift cards, etc.
 */

import axios from 'axios';
import { SecureStorage } from '../../../utils/security';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Execute a money transfer between accounts
 */
export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description?: string;
  idempotencyKey?: string;
}

export interface TransferResponse {
  transfer: {
    id: string;
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    type: string;
    description?: string;
    createdAt: string;
  };
}

export const executeTransfer = async (data: TransferRequest): Promise<TransferResponse> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Generate idempotency key if not provided
    const idempotencyKey = data.idempotencyKey || `transfer-${Date.now()}-${Math.random()}`;

    const response = await axios.post(
      `${API_URL}/api/v1/transaction/transfer`,
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
    console.error('Error executing transfer:', error);
    throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to execute transfer');
  }
};

/**
 * Get exchange rate for currency conversion
 */
export interface ExchangeRateRequest {
  fromCurrency: string;
  toCurrency: string;
  amount?: number;
}

export interface ExchangeRateResponse {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  amount?: number;
  convertedAmount?: number;
}

export const getExchangeRate = async (data: ExchangeRateRequest): Promise<ExchangeRateResponse> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${API_URL}/api/v1/currency/convert`,
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
    console.error('Error getting exchange rate:', error);
    throw new Error(error.response?.data?.error || 'Failed to get exchange rate');
  }
};

/**
 * Airtime Top-up via Reloadly
 */
export interface AirtimeTopupRequest {
  operatorId: string;
  amount: number;
  recipientPhone: string;
  countryCode: string;
  currency?: string;
}

export interface AirtimeTopupResponse {
  transactionId: string;
  status: string;
  operatorTransactionId?: string;
}

export const sendAirtimeTopup = async (data: AirtimeTopupRequest): Promise<AirtimeTopupResponse> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${API_URL}/api/reloadly/airtime/topup`,
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
    console.error('Error sending airtime topup:', error);
    throw new Error(error.response?.data?.error || 'Failed to send airtime topup');
  }
};

/**
 * Get Reloadly operators for a country
 */
export const getOperators = async (countryCode?: string) => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = countryCode
      ? `${API_URL}/api/reloadly/operators?countryCode=${countryCode}`
      : `${API_URL}/api/reloadly/operators`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error getting operators:', error);
    throw new Error(error.response?.data?.error || 'Failed to get operators');
  }
};

/**
 * Auto-detect operator from phone number
 */
export const autoDetectOperator = async (phoneNumber: string, countryCode: string) => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${API_URL}/api/reloadly/operators/auto-detect`,
      { phoneNumber, countryCode },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error auto-detecting operator:', error);
    throw new Error(error.response?.data?.error || 'Failed to detect operator');
  }
};

/**
 * Pay utility bill via Reloadly
 */
export interface BillPaymentRequest {
  billerId: string;
  amount: number;
  accountNumber: string;
  countryCode: string;
  currency?: string;
}

export interface BillPaymentResponse {
  transactionId: string;
  status: string;
  confirmationNumber?: string;
}

export const payBill = async (data: BillPaymentRequest): Promise<BillPaymentResponse> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${API_URL}/api/reloadly/utilities/pay`,
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
    console.error('Error paying bill:', error);
    throw new Error(error.response?.data?.error || 'Failed to pay bill');
  }
};

/**
 * Get billers for a country
 */
export const getBillers = async (countryCode?: string) => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = countryCode
      ? `${API_URL}/api/reloadly/utilities/billers?countryCode=${countryCode}`
      : `${API_URL}/api/reloadly/utilities/billers`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error getting billers:', error);
    throw new Error(error.response?.data?.error || 'Failed to get billers');
  }
};

/**
 * Purchase gift card via Reloadly
 */
export interface GiftCardRequest {
  productId: string;
  amount: number;
  countryCode: string;
  currency?: string;
  recipientEmail?: string;
}

export interface GiftCardResponse {
  transactionId: string;
  status: string;
  redemptionCode?: string;
  redemptionInstructions?: string;
}

export const purchaseGiftCard = async (data: GiftCardRequest): Promise<GiftCardResponse> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${API_URL}/api/reloadly/giftcards/purchase`,
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
    console.error('Error purchasing gift card:', error);
    throw new Error(error.response?.data?.error || 'Failed to purchase gift card');
  }
};

/**
 * Get gift card products
 */
export const getGiftCardProducts = async (countryCode?: string) => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = countryCode
      ? `${API_URL}/api/reloadly/giftcards/products?countryCode=${countryCode}`
      : `${API_URL}/api/reloadly/giftcards/products`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error getting gift card products:', error);
    throw new Error(error.response?.data?.error || 'Failed to get gift card products');
  }
};

/**
 * Get transaction status
 */
export const getTransactionStatus = async (transactionId: string) => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(
      `${API_URL}/api/v1/transaction/transfers/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error getting transaction status:', error);
    throw new Error(error.response?.data?.error || 'Failed to get transaction status');
  }
};

