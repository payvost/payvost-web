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
  cardType: 'visa' | 'mastercard';
  expiry?: string;
  balance: number;
  currency: string;
  theme?: string;
  status: 'active' | 'frozen' | 'terminated';
  spendingLimit?: {
    amount: number;
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  };
}

type CardV2 = {
  id: string;
  label: string;
  last4: string;
  network: 'VISA' | 'MASTERCARD';
  expMonth?: number | null;
  expYear?: number | null;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'TERMINATED';
  controls?: { spendLimitAmount?: any; spendLimitInterval?: string } | null;
};

function toExpiry(expMonth?: number | null, expYear?: number | null): string | undefined {
  if (!expMonth || !expYear) return undefined;
  return `${String(expMonth).padStart(2, '0')}/${String(expYear).slice(-2)}`;
}

function mapCardV2ToLegacy(card: CardV2): VirtualCard {
  return {
    id: card.id,
    cardLabel: card.label,
    last4: card.last4,
    cardType: card.network === 'MASTERCARD' ? 'mastercard' : 'visa',
    expiry: toExpiry(card.expMonth, card.expYear),
    balance: 0,
    currency: card.currency || 'USD',
    status: card.status === 'FROZEN' ? 'frozen' : card.status === 'TERMINATED' ? 'terminated' : 'active',
    spendingLimit: card.controls?.spendLimitAmount
      ? {
          amount: Number(card.controls.spendLimitAmount),
          interval: ((card.controls.spendLimitInterval || 'MONTHLY') as string).toLowerCase() as any,
        }
      : undefined,
  };
}

async function getAuthHeader() {
  const token = await SecureStorage.getToken('auth_token');
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

async function getDefaultAccountId(workspaceType: 'PERSONAL' | 'BUSINESS'): Promise<string> {
  const headers = await getAuthHeader();
  const resp = await axios.get(`${API_URL}/api/wallet/accounts`, { headers });
  const accounts = resp.data?.accounts || [];
  const wantedType = workspaceType === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL';
  const match = accounts.find((a: any) => a.type === wantedType) || accounts[0];
  if (!match?.id) throw new Error('No funding account available');
  return match.id;
}

/**
 * Get all virtual cards for the user
 */
export const getCards = async (): Promise<VirtualCard[]> => {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get(`${API_URL}/api/v1/cards?workspaceType=PERSONAL&limit=200`, { headers });
    const cards = (response.data?.cards || []) as CardV2[];
    return cards.map(mapCardV2ToLegacy);
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
  workspaceType?: 'PERSONAL' | 'BUSINESS';
  accountId?: string;
  network?: 'VISA' | 'MASTERCARD';
  spendingLimit?: {
    amount: number;
    interval?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ALL_TIME';
  };
  theme?: string;
}

export interface CreateCardResponse {
  card: VirtualCard;
}

export const createCard = async (data: CreateCardRequest): Promise<CreateCardResponse> => {
  try {
    const workspaceType = data.workspaceType || 'PERSONAL';
    const headers = await getAuthHeader();
    const accountId = data.accountId || (await getDefaultAccountId(workspaceType));

    const payload = {
      workspaceType,
      accountId,
      label: data.cardLabel,
      network: data.network || 'VISA',
      type: 'VIRTUAL',
      controls: data.spendingLimit?.amount
        ? {
            spendLimitAmount: data.spendingLimit.amount,
            spendLimitInterval: data.spendingLimit.interval || 'MONTHLY',
          }
        : undefined,
    };

    const response = await axios.post(`${API_URL}/api/v1/cards`, payload, {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

    const created = response.data?.card as CardV2;
    return { card: mapCardV2ToLegacy(created) };
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
    const headers = await getAuthHeader();
    const response = await axios.get(`${API_URL}/api/v1/cards/${cardId}`, { headers });
    const card = response.data?.card as CardV2;
    return mapCardV2ToLegacy(card);
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
  status: 'active' | 'frozen' | 'terminated'
): Promise<VirtualCard> => {
  try {
    const headers = await getAuthHeader();
    if (status === 'terminated') {
      await axios.post(`${API_URL}/api/v1/cards/${cardId}/terminate`, {}, { headers });
      return await getCardDetails(cardId);
    }

    const endpoint = status === 'frozen' ? 'freeze' : 'unfreeze';
    await axios.post(`${API_URL}/api/v1/cards/${cardId}/${endpoint}`, {}, { headers });
    return await getCardDetails(cardId);
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
    const headers = await getAuthHeader();
    await axios.post(`${API_URL}/api/v1/cards/${cardId}/terminate`, {}, { headers });
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
    const headers = await getAuthHeader();
    const response = await axios.get(`${API_URL}/api/v1/cards/${cardId}/transactions`, {
      params: { limit },
      headers,
    });
    return response.data.transactions || [];
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
  spendingLimit: { amount: number; interval?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ALL_TIME' }
): Promise<VirtualCard> => {
  try {
    const headers = await getAuthHeader();
    await axios.patch(
      `${API_URL}/api/v1/cards/${cardId}/controls`,
      {
        spendLimitAmount: spendingLimit.amount,
        spendLimitInterval: spendingLimit.interval || 'MONTHLY',
      },
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
    return await getCardDetails(cardId);
  } catch (error: any) {
    console.error('Error updating card limit:', error);
    throw new Error(error.response?.data?.error || 'Failed to update card limit');
  }
};

