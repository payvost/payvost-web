/**
 * Cards API
 * 
 * API calls for virtual card creation and management
 */

import axios from 'axios';
import { SecureStorage } from '../../../utils/security';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export interface VirtualCard {
  id: string;
  cardLabel: string;
  last4: string;
  cardType: 'visa' | 'mastercard' | 'amex';
  expiry: string;
  cvv?: string;
  balance: number;
  currency: string;
  theme?: string;
  status: 'active' | 'frozen' | 'cancelled';
  fullNumber?: string;
  spendingLimit?: {
    amount: number;
    currency: string;
  };
  cardModel?: 'debit' | 'credit';
  availableCredit?: number;
}

/**
 * Get all virtual cards for the user
 */
export const getCards = async (): Promise<VirtualCard[]> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${API_URL}/api/cards`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.cards || response.data || [];
  } catch (error: any) {
    console.error('Error fetching cards:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch cards');
  }
};

/**
 * Create a new virtual card
 */
export interface CreateCardRequest {
  cardLabel: string;
  currency: string;
  cardModel?: 'debit' | 'credit';
  spendingLimit?: {
    amount: number;
    currency: string;
  };
  theme?: string;
}

export interface CreateCardResponse {
  card: VirtualCard;
}

export const createCard = async (data: CreateCardRequest): Promise<CreateCardResponse> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${API_URL}/api/cards`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { card: response.data };
  } catch (error: any) {
    console.error('Error creating card:', error);
    throw new Error(error.response?.data?.error || 'Failed to create card');
  }
};

/**
 * Get card details
 */
export const getCardDetails = async (cardId: string): Promise<VirtualCard> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${API_URL}/api/cards/${cardId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.card || response.data;
  } catch (error: any) {
    console.error('Error fetching card details:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch card details');
  }
};

/**
 * Freeze/unfreeze a card
 */
export const updateCardStatus = async (
  cardId: string,
  status: 'active' | 'frozen' | 'cancelled'
): Promise<VirtualCard> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.patch(
      `${API_URL}/api/cards/${cardId}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.card || response.data;
  } catch (error: any) {
    console.error('Error updating card status:', error);
    throw new Error(error.response?.data?.error || 'Failed to update card status');
  }
};

/**
 * Delete/cancel a card
 */
export const deleteCard = async (cardId: string): Promise<void> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    await axios.delete(`${API_URL}/api/cards/${cardId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: any) {
    console.error('Error deleting card:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete card');
  }
};

/**
 * Get card transactions
 */
export const getCardTransactions = async (cardId: string, limit = 50, offset = 0) => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(
      `${API_URL}/api/cards/${cardId}/transactions`,
      {
        params: { limit, offset },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.transactions || response.data || [];
  } catch (error: any) {
    console.error('Error fetching card transactions:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch card transactions');
  }
};

/**
 * Update card spending limit
 */
export const updateCardLimit = async (
  cardId: string,
  spendingLimit: { amount: number; currency: string }
): Promise<VirtualCard> => {
  try {
    const token = await SecureStorage.getToken('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.patch(
      `${API_URL}/api/cards/${cardId}/limit`,
      { spendingLimit },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.card || response.data;
  } catch (error: any) {
    console.error('Error updating card limit:', error);
    throw new Error(error.response?.data?.error || 'Failed to update card limit');
  }
};

