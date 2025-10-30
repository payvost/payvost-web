import { PrismaClient, Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { Decimal } from 'decimal.js';

export class TransactionManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate a deterministic transaction ID based on input parameters
   */
  private generateTransactionId(params: any): string {
    const input = JSON.stringify(params);
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * Validate transaction against risk rules and limits
   */
  private async validateTransaction(params: {
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    currency: string;
  }): Promise<boolean> {
    const { fromAccountId, amount, currency } = params;

    // 1. Check account limits (mocked until accountLimits table is created)
    // const accountLimits = await this.prisma.accountLimits.findUnique({
    //   where: { accountId: fromAccountId }
    // });

    // For now, use basic validation without account limits
    const accountLimits = null;

    if (accountLimits) {
      // Daily limit check
      const dailyTransactions = await this.prisma.transfer.aggregate({
        where: {
          fromAccountId,
          currency,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        },
        _sum: { amount: true }
      });

      const dailyTotal = new Decimal(dailyTransactions._sum.amount || 0);
      if (dailyTotal.plus(amount).greaterThan((accountLimits as any).dailyLimit)) {
        throw new Error('Daily transfer limit exceeded');
      }

      // Monthly limit check
      const monthlyTransactions = await this.prisma.transfer.aggregate({
        where: {
          fromAccountId,
          currency,
          createdAt: { gte: new Date(new Date().setDate(1)) }
        },
        _sum: { amount: true }
      });

      const monthlyTotal = new Decimal(monthlyTransactions._sum.amount || 0);
      if (monthlyTotal.plus(amount).greaterThan((accountLimits as any).monthlyLimit)) {
        throw new Error('Monthly transfer limit exceeded');
      }
    }

    return true;
  }

  /**
   * Execute a financial transaction with full ACID compliance
   */
  async executeTransaction(params: {
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    currency: string;
    type: string;
    description?: string;
    metadata?: Record<string, any>;
    idempotencyKey?: string;
  }): Promise<any> {
    const transactionId = params.idempotencyKey || this.generateTransactionId(params);

    // Check for existing transaction
    const existing = await this.prisma.transfer.findUnique({
      where: { idempotencyKey: transactionId }
    });

    if (existing) {
      return existing;
    }

    // Validate transaction
    await this.validateTransaction(params);

    // Execute transaction in a database transaction
    return await this.prisma.$transaction(async (tx) => {
      // Lock accounts
      const accounts: any[] = await tx.$queryRaw`
        SELECT id, balance, currency, status
        FROM "Account"
        WHERE id IN (${params.fromAccountId}, ${params.toAccountId})
        FOR UPDATE
      `;

      const fromAccount = accounts.find((a: any) => a.id === params.fromAccountId);
      const toAccount = accounts.find((a: any) => a.id === params.toAccountId);

      // Validate accounts
      if (!fromAccount || !toAccount) {
        throw new Error('Account not found');
      }

      if (fromAccount.status !== 'ACTIVE' || toAccount.status !== 'ACTIVE') {
        throw new Error('Account is not active');
      }

      if (fromAccount.currency !== params.currency || toAccount.currency !== params.currency) {
        throw new Error('Currency mismatch');
      }

      // Check balance
      if (Number(fromAccount.balance) < Number(params.amount)) {
        throw new Error('Insufficient balance');
      }

      // Create transfer record
      const transfer = await tx.transfer.create({
        data: {
          fromAccountId: params.fromAccountId,
          toAccountId: params.toAccountId,
          amount: params.amount,
          currency: params.currency,
          status: 'COMPLETED',
          type: params.type as any, // Cast to TransactionType
          description: params.description,
          idempotencyKey: transactionId
        }
      });

      // Update account balances
      await tx.account.update({
        where: { id: params.fromAccountId },
        data: { 
          balance: { decrement: params.amount }
        }
      });

      await tx.account.update({
        where: { id: params.toAccountId },
        data: { 
          balance: { increment: params.amount }
        }
      });

      // Create ledger entries
      await tx.ledgerEntry.createMany({
        data: [
          {
            accountId: params.fromAccountId,
            amount: `-${params.amount}`,
            type: 'DEBIT',
            balanceAfter: (Number(fromAccount.balance) - Number(params.amount)).toString(),
            description: params.description
          },
          {
            accountId: params.toAccountId,
            amount: params.amount,
            type: 'CREDIT',
            balanceAfter: (Number(toAccount.balance) + Number(params.amount)).toString(),
            description: params.description
          }
        ]
      });

      return transfer;
    });
  }
}