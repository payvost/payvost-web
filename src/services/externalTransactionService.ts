/**
 * External Transaction Service (Client-safe)
 * 
 * Client-side compatible service that calls Next.js API routes for
 * external partner transaction data. All database access happens on the server.
 */

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
    // Optional: Implement POST API if needed in the future
    throw new Error('Not implemented on client. Use server route to create transactions.');
  }

  /**
   * Update an external transaction
   */
  async update(id: string, data: UpdateExternalTransactionDto) {
    // Optional: Implement PATCH API if needed in the future
    throw new Error('Not implemented on client. Use server route to update transactions.');
  }

  /**
   * Update by provider transaction ID
   */
  async updateByProviderTransactionId(
    _providerTransactionId: string,
    _data: UpdateExternalTransactionDto
  ) {
    // Optional: Implement PATCH API if needed in the future
    throw new Error('Not implemented on client. Use server route to update transactions.');
  }

  /**
   * Get transaction by ID
   */
  async getById(id: string) {
    const res = await fetch(`/api/external-transactions/by-id?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch external transaction');
    return res.json();
  }

  /**
   * Get transaction by provider transaction ID
   */
  async getByProviderTransactionId(providerTransactionId: string) {
    const res = await fetch(`/api/external-transactions/by-provider?id=${encodeURIComponent(providerTransactionId)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch external transaction');
    return res.json();
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
    // Note: Filtering by provider/type/status can be added to API route when needed
    const res = await fetch(`/api/external-transactions/by-user?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch external transactions');
    return res.json();
  }

  /**
   * Get recent transactions
   */
  async getRecent(limit = 10) {
    const res = await fetch(`/api/external-transactions/by-user?limit=${limit}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch external transactions');
    return res.json();
  }

  /**
   * Get transaction statistics for a user
   */
  async getStats(userId: string) {
    const params = new URLSearchParams({ userId });
    const res = await fetch(`/api/external-transactions/stats?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch external transaction stats');
    return res.json();
  }
}

// Export singleton instance
export const externalTransactionService = new ExternalTransactionService();

// Export default
export default externalTransactionService;
