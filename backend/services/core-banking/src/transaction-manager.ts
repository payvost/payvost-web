import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'crypto';
import { Decimal } from 'decimal.js';

export class TransactionManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Execute a transfer with ACID guarantees
   */
  async executeTransfer(params: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    currency: string;
    description?: string;
    idempotencyKey?: string;
  }): Promise<any> {
    const { fromAccountId, toAccountId, amount, currency, description, idempotencyKey } = params;

    // Generate deterministic idempotency key if not provided
    const finalIdempotencyKey = idempotencyKey || this.generateIdempotencyKey(params);

    // Check for existing transaction with this idempotency key
    const existing = await this.prisma.transfer.findUnique({
      where: { idempotencyKey: finalIdempotencyKey },
    });

    if (existing) {
      return existing;
    }

    // Mock account limits check (since accountLimits table doesn't exist yet)
    const mockLimits = {
      dailyLimit: 100000,
      monthlyLimit: 500000,
    };

    // Calculate daily and monthly totals using Decimal
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyTotal = await this.prisma.transfer.aggregate({
      where: {
        fromAccountId,
        createdAt: { gte: today },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    const dailySum = dailyTotal._sum.amount 
      ? new Decimal(dailyTotal._sum.amount.toString()).plus(amount)
      : new Decimal(amount);

    if (dailySum.greaterThan(mockLimits.dailyLimit)) {
      throw new Error('Daily transfer limit exceeded');
    }

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyTotal = await this.prisma.transfer.aggregate({
      where: {
        fromAccountId,
        createdAt: { gte: monthStart },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    const monthlySum = monthlyTotal._sum.amount
      ? new Decimal(monthlyTotal._sum.amount.toString()).plus(amount)
      : new Decimal(amount);

    if (monthlySum.greaterThan(mockLimits.monthlyLimit)) {
      throw new Error('Monthly transfer limit exceeded');
    }

    // Execute transfer in transaction
    return await this.prisma.$transaction(async (tx: any) => {
      // Lock accounts for update
      const accounts = await tx.$queryRaw`
        SELECT id, balance, currency 
        FROM "Account" 
        WHERE id IN (${fromAccountId}, ${toAccountId})
        FOR UPDATE
      `;

      const fromAccount = (accounts as any[]).find((a: any) => a.id === fromAccountId);
      const toAccount = (accounts as any[]).find((a: any) => a.id === toAccountId);

      if (!fromAccount || !toAccount) {
        throw new Error('One or both accounts not found');
      }

      if (fromAccount.currency !== currency || toAccount.currency !== currency) {
        throw new Error('Currency mismatch');
      }

      const fromBalance = new Decimal(fromAccount.balance.toString());
      if (fromBalance.lessThan(amount)) {
        throw new Error('Insufficient funds');
      }

      // Create transfer record - Remove 'type' field as it doesn't exist in schema
      const transfer = await tx.transfer.create({
        data: {
          fromAccountId,
          toAccountId,
          amount: new Prisma.Decimal(amount),
          currency,
          status: 'COMPLETED',
          description: description || 'Transfer',
          idempotencyKey: finalIdempotencyKey,
        },
      });

      // Update account balances - Remove 'lastTransactionAt' field
      await tx.account.update({
        where: { id: fromAccountId },
        data: {
          balance: { decrement: new Prisma.Decimal(amount) },
        },
      });

      await tx.account.update({
        where: { id: toAccountId },
        data: {
          balance: { increment: new Prisma.Decimal(amount) },
        },
      });

      // Create ledger entries - Remove 'transferId' field
      await tx.ledgerEntry.createMany({
        data: [
          {
            accountId: fromAccountId,
            amount: new Prisma.Decimal(-amount),
            currency,
            type: 'DEBIT',
            description: `Transfer to ${toAccountId}`,
          },
          {
            accountId: toAccountId,
            amount: new Prisma.Decimal(amount),
            currency,
            type: 'CREDIT',
            description: `Transfer from ${fromAccountId}`,
          },
        ],
      });

      return transfer;
    });
  }

  private generateIdempotencyKey(params: any): string {
    const data = JSON.stringify(params);
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}