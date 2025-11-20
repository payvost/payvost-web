import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma';

// Define TransactionType locally to avoid Prisma import issues during build
export type TransactionType = 
  | 'INTERNAL_TRANSFER'
  | 'EXTERNAL_TRANSFER'
  | 'CARD_PAYMENT'
  | 'ATM_WITHDRAWAL'
  | 'DEPOSIT'
  | 'CURRENCY_EXCHANGE';

// Use Prisma enum - fallback to string if not available
export const TransactionTypeEnum = {
  INTERNAL_TRANSFER: 'INTERNAL_TRANSFER',
  EXTERNAL_TRANSFER: 'EXTERNAL_TRANSFER',
  CARD_PAYMENT: 'CARD_PAYMENT',
  ATM_WITHDRAWAL: 'ATM_WITHDRAWAL',
  DEPOSIT: 'DEPOSIT',
  CURRENCY_EXCHANGE: 'CURRENCY_EXCHANGE',
} as const;

export interface TransferResult {
  success: boolean;
  transferId?: string;
  error?: string;
}

/**
 * Idempotent funds transfer between accounts using Prisma transactions.
 * - Ensures idempotency via idempotencyKey stored on Transfer
 * - Locks account rows using FOR UPDATE to avoid race conditions
 */
export async function transferFunds(
  fromAccountId: string,
  toAccountId: string,
  amount: number | string,
  currency: string,
  idempotencyKey?: string,
  description?: string
): Promise<TransferResult> {
  const amountStr = typeof amount === 'string' ? amount : amount.toString();

  try {
    // Quick idempotency check outside tx to avoid unnecessary work
    if (idempotencyKey) {
      const existing = await prisma.transfer.findUnique({ where: { idempotencyKey } });
      if (existing) {
        return { success: true, transferId: existing.id };
      }
    }

  const transfer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Lock the two accounts to perform safe balance checks and updates
      const lockedRows: Array<{ id: string; balance: string }> = await tx.$queryRaw`
        SELECT id, balance
        FROM "Account"
        WHERE id IN (${fromAccountId}, ${toAccountId})
        FOR UPDATE
      ` as any;

      const fromRow = lockedRows.find((r) => r.id === fromAccountId);
      const toRow = lockedRows.find((r) => r.id === toAccountId);

      if (!fromRow || !toRow) {
        throw new Error('Account not found or currency mismatch');
      }

      const fromBalance = parseFloat(fromRow.balance);
      const toBalance = parseFloat(toRow.balance);
      const amt = parseFloat(amountStr);

      if (isNaN(amt) || amt <= 0) {
        throw new Error('Invalid transfer amount');
      }

      if (fromBalance < amt) {
        throw new Error('Insufficient funds');
      }

      // Create transfer record (pending -> completed)
      const created = await tx.transfer.create({
        data: {
          fromAccountId,
          toAccountId,
          amount: amountStr,
          currency,
          status: 'completed',
          type: TransactionTypeEnum.INTERNAL_TRANSFER as any,
          idempotencyKey: idempotencyKey ?? null,
          description: description ?? null,
        },
      });

      // Update balances
      const newFrom = (fromBalance - amt).toFixed(8);
      const newTo = (toBalance + amt).toFixed(8);

      await tx.account.update({ where: { id: fromAccountId }, data: { balance: newFrom } });
      await tx.account.update({ where: { id: toAccountId }, data: { balance: newTo } });

      // Ledger entries
      await tx.ledgerEntry.create({
        data: {
          accountId: fromAccountId,
          amount: `-${amountStr}`,
          balanceAfter: newFrom,
          type: 'debit',
          description: description ?? 'transfer',
          referenceId: created.id,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          accountId: toAccountId,
          amount: amountStr,
          balanceAfter: newTo,
          type: 'credit',
          description: description ?? 'transfer',
          referenceId: created.id,
        },
      });

      return created;
    });

    return { success: true, transferId: transfer.id };
  } catch (err: any) {
    return { success: false, error: err.message ?? String(err) };
  }
}

export async function getAccountBalance(accountId: string) {
  const res = await prisma.account.findUnique({ where: { id: accountId }, select: { balance: true, currency: true } });
  if (!res) return null;
  return res;
}

export async function createAccount(userId: string, currency: string) {
  const res = await prisma.account.create({ data: { userId, currency, balance: '0' } });
  return res.id;
}

export default prisma;
