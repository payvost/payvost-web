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
  /**
   * Create a new transaction
   */
  async create(data: CreateTransactionDto): Promise<Transaction> {
    try {
      const response = await apiClient.post<{ transaction: Transaction }>(
        '/api/transaction/create',
        data
      );
      return response.transaction;
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
      const response = await apiClient.get<{ transaction: Transaction }>(
        `/api/transaction/${transactionId}`
      );
      return response.transaction;
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
      const endpoint = queryString ? `/api/transaction?${queryString}` : '/api/transaction';

      const response = await apiClient.get<{ transactions: Transaction[] }>(endpoint);
      return response.transactions;
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
      const response = await apiClient.get<{ transactions: Transaction[] }>(
        `/api/transaction/user?limit=${limit}&offset=${offset}`
      );
      return response.transactions;
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
    try {
      const response = await apiClient.patch<{ transaction: Transaction }>(
        `/api/transaction/${transactionId}`,
        { status }
      );
      return response.transaction;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to update transaction: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Cancel a transaction
   */
  async cancel(transactionId: string): Promise<Transaction> {
    try {
      return await this.updateStatus(transactionId, 'CANCELLED');
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to cancel transaction: ${error.message}`);
      }
      throw error;
    }
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
