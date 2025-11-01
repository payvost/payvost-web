/**
 * External Transaction Service
 * 
 * Service for tracking external partner transactions (Reloadly, Rapyd)
 * Handles creation, updates, and queries for external transactions
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    try {
      const transaction = await prisma.externalTransaction.create({
        data: {
          userId: data.userId,
          accountId: data.accountId,
          provider: data.provider,
          providerTransactionId: data.providerTransactionId,
          type: data.type,
          status: 'PENDING',
          amount: data.amount,
          currency: data.currency,
          recipientDetails: data.recipientDetails,
          metadata: data.metadata,
        },
      });

      return transaction;
    } catch (error) {
      console.error('Error creating external transaction:', error);
      throw new Error(`Failed to create external transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an external transaction
   */
  async update(id: string, data: UpdateExternalTransactionDto) {
    try {
      const transaction = await prisma.externalTransaction.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return transaction;
    } catch (error) {
      console.error('Error updating external transaction:', error);
      throw new Error(`Failed to update external transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update by provider transaction ID
   */
  async updateByProviderTransactionId(
    providerTransactionId: string,
    data: UpdateExternalTransactionDto
  ) {
    try {
      const transaction = await prisma.externalTransaction.update({
        where: { providerTransactionId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return transaction;
    } catch (error) {
      console.error('Error updating external transaction by provider ID:', error);
      throw new Error(`Failed to update external transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction by ID
   */
  async getById(id: string) {
    try {
      const transaction = await prisma.externalTransaction.findUnique({
        where: { id },
      });

      return transaction;
    } catch (error) {
      console.error('Error fetching external transaction:', error);
      throw new Error(`Failed to fetch external transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction by provider transaction ID
   */
  async getByProviderTransactionId(providerTransactionId: string) {
    try {
      const transaction = await prisma.externalTransaction.findUnique({
        where: { providerTransactionId },
      });

      return transaction;
    } catch (error) {
      console.error('Error fetching external transaction by provider ID:', error);
      throw new Error(`Failed to fetch external transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    try {
      const transactions = await prisma.externalTransaction.findMany({
        where: {
          userId,
          ...(options?.provider && { provider: options.provider }),
          ...(options?.type && { type: options.type }),
          ...(options?.status && { status: options.status }),
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching user external transactions:', error);
      throw new Error(`Failed to fetch external transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recent transactions
   */
  async getRecent(limit = 10) {
    try {
      const transactions = await prisma.externalTransaction.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching recent external transactions:', error);
      throw new Error(`Failed to fetch external transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction statistics for a user
   */
  async getStats(userId: string) {
    try {
      const [total, completed, pending, failed] = await Promise.all([
        prisma.externalTransaction.count({
          where: { userId },
        }),
        prisma.externalTransaction.count({
          where: { userId, status: 'COMPLETED' },
        }),
        prisma.externalTransaction.count({
          where: { userId, status: { in: ['PENDING', 'PROCESSING'] } },
        }),
        prisma.externalTransaction.count({
          where: { userId, status: 'FAILED' },
        }),
      ]);

      const totalAmount = await prisma.externalTransaction.aggregate({
        where: { userId, status: 'COMPLETED' },
        _sum: {
          amount: true,
        },
      });

      return {
        total,
        completed,
        pending,
        failed,
        totalAmount: totalAmount._sum.amount || 0,
      };
    } catch (error) {
      console.error('Error fetching external transaction stats:', error);
      throw new Error(`Failed to fetch stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const externalTransactionService = new ExternalTransactionService();

// Export default
export default externalTransactionService;
