import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'crypto';
import Decimal from 'decimal.js';
import { AuditLogContext, logFinancialTransaction, AuditAction } from '../../../common/audit-logger';

// Use Decimal from decimal.js - Prisma accepts Decimal instances in v6
const PrismaDecimal = Decimal;

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
    userId?: string;
    auditContext?: AuditLogContext;
  }): Promise<any> {
    const { fromAccountId, toAccountId, amount, currency, description, idempotencyKey, userId, auditContext } = params;

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
        throw new Error('Insufficient balance');
      }

      // Calculate new balances
      const fromNewBalance = fromBalance.minus(amount);
      const toNewBalance = new Decimal(toAccount.balance.toString()).plus(amount);

      // Create transfer record including required `type` field
      const transfer = await tx.transfer.create({
        data: {
          fromAccountId,
          toAccountId,
          amount: new PrismaDecimal(amount),
          currency,
          status: 'COMPLETED',
          type: 'INTERNAL_TRANSFER',
          description: description || 'Transfer',
          idempotencyKey: finalIdempotencyKey,
        },
      });

      // Update account balances - Remove 'lastTransactionAt' field
      await tx.account.update({
        where: { id: fromAccountId },
        data: {
          balance: { decrement: new PrismaDecimal(amount) },
        },
      });

      await tx.account.update({
        where: { id: toAccountId },
        data: {
          balance: { increment: new PrismaDecimal(amount) },
        },
      });

      // Create ledger entries - Remove 'transferId' field
      await tx.ledgerEntry.createMany({
        data: [
          {
            accountId: fromAccountId,
            amount: new PrismaDecimal(-amount),
            balanceAfter: new PrismaDecimal(fromNewBalance.toString()),
            type: 'DEBIT',
            description: `Transfer to ${toAccountId}`,
          },
          {
            accountId: toAccountId,
            amount: new PrismaDecimal(amount),
            balanceAfter: new PrismaDecimal(toNewBalance.toString()),
            type: 'CREDIT',
            description: `Transfer from ${fromAccountId}`,
          },
        ],
      });

      // Log audit trail
      if (userId && auditContext) {
        await logFinancialTransaction(
          AuditAction.TRANSFER_COMPLETED,
          transfer.id,
          fromAccountId,
          userId,
          amount.toString(),
          currency,
          description || `Transfer to ${toAccountId}`,
          auditContext
        );
      }

      // Process referral reward for recipient's first transaction (non-blocking)
      try {
        const toAccount = await tx.account.findUnique({
          where: { id: toAccountId },
          select: { userId: true },
        });
        
        if (toAccount?.userId) {
          // Import and call referral hook asynchronously (don't block transaction)
          // This will be processed in the background
          setImmediate(async () => {
            try {
              const { onTransactionCompleted } = await import('../../referral/transaction-hook');
              await onTransactionCompleted(toAccount.userId, amount, currency);
            } catch (error) {
              console.error('Error processing referral reward:', error);
            }
          });
        }
      } catch (error) {
        // Don't fail transaction if referral processing fails
        console.error('Error setting up referral reward processing:', error);
      }

      return transfer;
    });
  }

  private generateIdempotencyKey(params: any): string {
    const data = JSON.stringify(params);
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}