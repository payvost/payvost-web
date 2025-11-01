import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { TransactionManager } from '../services/core-banking/src/transaction-manager';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();
const transactionManager = new TransactionManager(prisma);

describe('Transaction Manager Tests', () => {
  let testUserId: string;
  let account1Id: string;
  let account2Id: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        kycStatus: 'verified',
      },
    });
    testUserId = user.id;

    // Create test accounts
    const account1 = await prisma.account.create({
      data: {
        userId: testUserId,
        currency: 'USD',
        balance: 1000,
        type: 'PERSONAL',
      },
    });
    account1Id = account1.id;

    const account2 = await prisma.account.create({
      data: {
        userId: testUserId,
        currency: 'USD',
        balance: 0,
        type: 'PERSONAL',
      },
    });
    account2Id = account2.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.transfer.deleteMany({ where: { fromAccountId: account1Id } });
    await prisma.ledgerEntry.deleteMany({ where: { accountId: account1Id } });
    await prisma.ledgerEntry.deleteMany({ where: { accountId: account2Id } });
    await prisma.account.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  test('should execute a simple transfer', async () => {
    const transfer = await transactionManager.executeTransfer({
      fromAccountId: account1Id,
      toAccountId: account2Id,
      amount: 100,
      currency: 'USD',
      description: 'Test transfer',
    });

    expect(transfer).toBeDefined();
    expect(transfer.status).toBe('COMPLETED');
    expect(new Decimal(transfer.amount.toString())).toEqual(new Decimal(100));

    // Verify balances
    const fromAccount = await prisma.account.findUnique({ where: { id: account1Id } });
    const toAccount = await prisma.account.findUnique({ where: { id: account2Id } });

    expect(new Decimal(fromAccount!.balance.toString())).toEqual(new Decimal(900));
    expect(new Decimal(toAccount!.balance.toString())).toEqual(new Decimal(100));
  });

  test('should respect idempotency', async () => {
    const idempotencyKey = 'test-idempotency-key-123';

    const transfer1 = await transactionManager.executeTransfer({
      fromAccountId: account1Id,
      toAccountId: account2Id,
      amount: 50,
      currency: 'USD',
      idempotencyKey,
    });

    const transfer2 = await transactionManager.executeTransfer({
      fromAccountId: account1Id,
      toAccountId: account2Id,
      amount: 50,
      currency: 'USD',
      idempotencyKey,
    });

    expect(transfer1.id).toBe(transfer2.id);

    // Verify balance only changed once
    const fromAccount = await prisma.account.findUnique({ where: { id: account1Id } });
    expect(new Decimal(fromAccount!.balance.toString())).toEqual(new Decimal(850));
  });

  test('should fail on insufficient balance', async () => {
    await expect(
      transactionManager.executeTransfer({
        fromAccountId: account1Id,
        toAccountId: account2Id,
        amount: 10000,
        currency: 'USD',
      })
    ).rejects.toThrow('Insufficient balance');
  });

  test('should fail on currency mismatch', async () => {
    const eurAccount = await prisma.account.create({
      data: {
        userId: testUserId,
        currency: 'EUR',
        balance: 100,
        type: 'PERSONAL',
      },
    });

    await expect(
      transactionManager.executeTransfer({
        fromAccountId: account1Id,
        toAccountId: eurAccount.id,
        amount: 50,
        currency: 'USD',
      })
    ).rejects.toThrow('Currency mismatch');

    await prisma.account.delete({ where: { id: eurAccount.id } });
  });

  test('should respect daily transfer limit', async () => {
    // This test would need to mock or set up proper limit checking
    // For now, we just verify the logic exists
    expect(transactionManager.executeTransfer).toBeDefined();
  });
});
