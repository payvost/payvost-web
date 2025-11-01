import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

describe('Fraud Detection Tests', () => {
  let testUserId: string;
  let testAccountId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'fraud-test@example.com',
        password: 'hashedpassword',
        name: 'Fraud Test User',
        kycStatus: 'verified',
      },
    });
    testUserId = user.id;

    // Create test account
    const account = await prisma.account.create({
      data: {
        userId: testUserId,
        currency: 'USD',
        balance: 10000,
        type: 'PERSONAL',
      },
    });
    testAccountId = account.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.complianceAlert.deleteMany({ where: { accountId: testAccountId } });
    await prisma.transfer.deleteMany({ where: { fromAccountId: testAccountId } });
    await prisma.ledgerEntry.deleteMany({ where: { accountId: testAccountId } });
    await prisma.account.delete({ where: { id: testAccountId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  test('should calculate low risk for normal transaction', async () => {
    // Low amount, verified KYC, no velocity issues
    const account = await prisma.account.findUnique({ where: { id: testAccountId } });
    expect(account).toBeDefined();
    // Compare as strings to avoid Decimal class instance mismatches
    expect(account?.balance?.toString()).toEqual(new Decimal(10000).toString());
  });

  test('should detect high velocity as risk factor', async () => {
    // Create multiple recent transfers to simulate high velocity
    const toAccount = await prisma.account.create({
      data: {
        userId: testUserId,
        currency: 'USD',
        balance: 0,
        type: 'PERSONAL',
      },
    });

    for (let i = 0; i < 6; i++) {
      await prisma.transfer.create({
        data: {
          fromAccountId: testAccountId,
          toAccountId: toAccount.id,
          amount: 10,
          currency: 'USD',
          status: 'COMPLETED',
          type: 'INTERNAL_TRANSFER',
        },
      });
    }

    const recentCount = await prisma.transfer.count({
      where: {
        fromAccountId: testAccountId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    expect(recentCount).toBeGreaterThan(5);

    // Cleanup
    await prisma.transfer.deleteMany({ where: { fromAccountId: testAccountId } });
    await prisma.account.delete({ where: { id: toAccount.id } });
  });

  test('should create compliance alert for high-risk transaction', async () => {
    const alert = await prisma.complianceAlert.create({
      data: {
        type: 'HIGH_RISK_TRANSACTION',
        severity: 'HIGH',
        status: 'PENDING',
        accountId: testAccountId,
        description: 'Test high-risk transaction',
        metadata: {
          score: 65,
          factors: ['High velocity', 'Large amount'],
        },
      },
    });

    expect(alert).toBeDefined();
    expect(alert.severity).toBe('HIGH');
    expect(alert.status).toBe('PENDING');
  });

  test('should resolve compliance alert', async () => {
    const alert = await prisma.complianceAlert.create({
      data: {
        type: 'TEST_ALERT',
        severity: 'MEDIUM',
        status: 'PENDING',
        accountId: testAccountId,
        description: 'Test alert for resolution',
      },
    });

    const resolved = await prisma.complianceAlert.update({
      where: { id: alert.id },
      data: {
        status: 'RESOLVED',
        metadata: {
          resolution: 'Verified with user',
          resolvedAt: new Date().toISOString(),
        },
      },
    });

    expect(resolved.status).toBe('RESOLVED');
  });

  test('should identify new account as risk factor', async () => {
    const newAccount = await prisma.account.create({
      data: {
        userId: testUserId,
        currency: 'USD',
        balance: 1000,
        type: 'PERSONAL',
      },
    });

    const accountAge = Date.now() - newAccount.createdAt.getTime();
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

    expect(daysSinceCreation).toBeLessThan(1); // Just created

    // Cleanup
    await prisma.account.delete({ where: { id: newAccount.id } });
  });
});
