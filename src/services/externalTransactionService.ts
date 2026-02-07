/**
 * External Transaction Service (Client-safe)
 * 
 * Client-side compatible service that calls Next.js API routes for
 * external partner transaction data. All database access happens on the server.
 */

import { apiClient } from './apiClient';

export type ExternalProvider = 'RELOADLY' | 'RAPYD' | 'PAYSTACK' | 'FLUTTERWAVE' | 'STRIPE';
export type ExternalTransactionType = 
  | 'AIRTIME_TOPUP'
  | 'DATA_BUNDLE'
  | 'GIFT_CARD'
  | 'BILL_PAYMENT'
  | 'PAYMENT'
  | 'PAYOUT'
  | 'VIRTUAL_ACCOUNT_DEPOSIT'
  | 'WALLET_TRANSFER'
  | 'CARD_ISSUANCE';
export type ExternalTransactionStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface CreateExternalTransactionDto {
  userId: string;
  accountId?: string;
  provider: ExternalProvider;
  providerTransactionId?: string;
  type: ExternalTransactionType;
  amount: number;
  currency: string;
  recipientDetails?: any;
  metadata?: any;
}

export interface UpdateExternalTransactionDto {
  status?: ExternalTransactionStatus;
  providerTransactionId?: string;
  errorMessage?: string;
  webhookReceived?: boolean;
  webhookData?: any;
  completedAt?: Date;
}

/**
 * External Transaction Service Class
 */
class ExternalTransactionService {
  /**
   * Create a new external transaction record
   */
  async create(data: CreateExternalTransactionDto) {
    return await apiClient.post('/api/external-transactions/create', data);
  }

  /**
   * Update an external transaction
   */
  async update(id: string, data: UpdateExternalTransactionDto) {
    return await apiClient.patch('/api/external-transactions/update', { id, ...data });
  }

  /**
   * Update by provider transaction ID
   */
  async updateByProviderTransactionId(
    providerTransactionId: string,
    data: UpdateExternalTransactionDto
  ) {
    return await apiClient.patch('/api/external-transactions/update', { providerTransactionId, ...data });
  }

  /**
   * Get transaction by ID
   */
  async getById(id: string) {
    return apiClient.get(`/api/external-transactions/by-id?id=${encodeURIComponent(id)}`);
  }

  /**
   * Get transaction by provider transaction ID
   */
  async getByProviderTransactionId(providerTransactionId: string) {
    return apiClient.get(`/api/external-transactions/by-provider?id=${encodeURIComponent(providerTransactionId)}`);
  }

  /**
   * Get all transactions for a user
   */
  async getByUser(userId: string, options?: {
    provider?: ExternalProvider;
    type?: ExternalTransactionType;
    status?: ExternalTransactionStatus;
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    params.set('userId', userId);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    if (options?.provider) params.set('provider', options.provider);
    if (options?.type) params.set('type', options.type);
    if (options?.status) params.set('status', options.status);
    return apiClient.get(`/api/external-transactions/by-user?${params.toString()}`);
  }

  /**
   * Get recent transactions
   */
  async getRecent(limit = 10) {
    return apiClient.get(`/api/external-transactions/by-user?limit=${limit}`);
  }

  /**
   * Get transaction statistics for a user
   */
  async getStats(userId: string) {
    const params = new URLSearchParams({ userId });
    return apiClient.get(`/api/external-transactions/stats?${params.toString()}`);
  }
}

// Export singleton instance
export const externalTransactionService = new ExternalTransactionService();

// Export default
export default externalTransactionService;
