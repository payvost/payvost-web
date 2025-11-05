/**
 * Transaction Service
 * 
 * Service for managing transactions and transfers.
 * Connects to the backend transaction service API.
 */

import { apiClient, ApiError } from './apiClient';

/**
 * Transaction types
 */
export type TransactionType = 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL' | 'DEPOSIT' | 'REMITTANCE';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Transaction {
  id: string;
  userId: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  fromAccountId: string;
  toAccountId?: string;
  toBeneficiaryId?: string;
  amount: number;
  currency: string;
  recipientCurrency?: string;
  type: TransactionType;
  description?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface TransactionListParams {
  accountId?: string;
  status?: TransactionStatus;
  type?: TransactionType;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Transaction Service class
 */
class TransactionService {
  private generateIdempotencyKey(): string {
    const globalCrypto = (typeof globalThis !== 'undefined' ? (globalThis as any).crypto : undefined) as
      | { randomUUID?: () => string; getRandomValues?: (buffer: Uint8Array) => Uint8Array }
      | undefined;

    if (globalCrypto?.randomUUID) {
      return globalCrypto.randomUUID();
    }

    // Fallback UUID v4 style generator
    const buffer = new Uint8Array(16);
    if (globalCrypto?.getRandomValues) {
      globalCrypto.getRandomValues(buffer);
    } else {
      for (let i = 0; i < buffer.length; i += 1) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
    }

    buffer[6] = (buffer[6] & 0x0f) | 0x40;
    buffer[8] = (buffer[8] & 0x3f) | 0x80;

    const hex = Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
  }

  /**
   * Create a new transaction
   */
  async create(data: CreateTransactionDto): Promise<Transaction> {
    try {
      const idempotencyKey = data.idempotencyKey || this.generateIdempotencyKey();

      const response = await apiClient.post<{ transfer: Transaction }>(
        '/api/transaction/transfer',
        {
          ...data,
          idempotencyKey,
        }
      );
      return response.transfer;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to create transaction: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get a specific transaction by ID
   */
  async get(transactionId: string): Promise<Transaction> {
    try {
      const response = await apiClient.get<{ transfer: Transaction }>(
        `/api/transaction/transfers/${transactionId}`
      );
      return response.transfer;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to fetch transaction: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get all transactions for the authenticated user
   */
  async list(params?: TransactionListParams): Promise<Transaction[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.accountId) queryParams.set('accountId', params.accountId);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.type) queryParams.set('type', params.type);
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.offset) queryParams.set('offset', params.offset.toString());
      if (params?.startDate) queryParams.set('startDate', params.startDate);
      if (params?.endDate) queryParams.set('endDate', params.endDate);

      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `/api/transaction/transfers?${queryString}`
        : '/api/transaction/transfers';

      const response = await apiClient.get<{
        transfers: Transaction[];
        pagination?: { total: number; limit: number; offset: number };
      }>(endpoint);
      return response.transfers;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to fetch transactions: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get transactions by user
   */
  async getByUser(limit = 50, offset = 0): Promise<Transaction[]> {
    try {
      const response = await apiClient.get<{
        transfers: Transaction[];
        pagination?: { total: number; limit: number; offset: number };
      }>(`/api/transaction/transfers?limit=${limit}&offset=${offset}`);
      return response.transfers;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to fetch user transactions: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    transactionId: string,
    status: TransactionStatus
  ): Promise<Transaction> {
    throw new Error(`Transaction status updates are not supported via the client API (attempted status: ${status}).`);
  }

  /**
   * Cancel a transaction
   */
  async cancel(transactionId: string): Promise<Transaction> {
    throw new Error(`Transaction cancellations are not supported via the client API (transactionId: ${transactionId}).`);
  }

  /**
   * Get transaction statistics
   */
  async getStats(accountId?: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    totalAmount: number;
  }> {
    try {
      const transactions = await this.list({ accountId });
      
      return {
        total: transactions.length,
        completed: transactions.filter(t => t.status === 'COMPLETED').length,
        pending: transactions.filter(t => t.status === 'PENDING' || t.status === 'PROCESSING').length,
        failed: transactions.filter(t => t.status === 'FAILED').length,
        totalAmount: transactions
          .filter(t => t.status === 'COMPLETED')
          .reduce((sum, t) => sum + t.amount, 0),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to get transaction stats: ${error.message}`);
      }
      throw error;
    }
  }
}

// Export singleton instance
export const transactionService = new TransactionService();

// Export default
export default transactionService;
