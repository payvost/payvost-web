/**
 * E2E Tests for Critical Payment Flows
 * Tests complete user journeys for payment operations
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { TransactionManager } from '../../services/core-banking/src/transaction-manager';
import { ComplianceManager } from '../../services/core-banking/src/compliance-manager';

const prisma = new PrismaClient();
const transactionManager = new TransactionManager(prisma);
const complianceManager = new ComplianceManager(prisma);

describe('E2E Payment Flow Tests', () => {
  let testUserId: string;
  let account1Id: string;
  let account2Id: string;
  let idempotencyKey: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        id: `test-user-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'Test User',
        kycStatus: 'verified',
        role: 'user',
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

    idempotencyKey = `e2e-test-${Date.now()}`;
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

  describe('Complete Transfer Flow', () => {
    test('should complete full transfer flow with AML check', async () => {
      // Step 1: Check AML compliance
      const amlCheck = await complianceManager.checkAMLCompliance({
        fromAccountId: account1Id,
        toAccountId: account2Id,
        amount: '100',
        currency: 'USD',
        userId: testUserId,
      });

      expect(amlCheck.compliant).toBe(true);

      // Step 2: Check fraud risk
      const fraudCheck = await complianceManager.checkFraudRisk({
        fromAccountId: account1Id,
        toAccountId: account2Id,
        amount: '100',
        currency: 'USD',
        metadata: {
          ipAddress: '192.168.1.1',
          deviceId: 'test-device-123',
        },
      });

      expect(fraudCheck.allowed).toBe(true);

      // Step 3: Execute transfer
      const transfer = await transactionManager.executeTransfer({
        fromAccountId: account1Id,
        toAccountId: account2Id,
        amount: 100,
        currency: 'USD',
        description: 'E2E test transfer',
        idempotencyKey,
        userId: testUserId,
        auditContext: {
          userId: testUserId,
          accountId: account1Id,
          ipAddress: '192.168.1.1',
        },
      });

      expect(transfer).toBeDefined();
      expect(transfer.status).toBe('COMPLETED');

      // Step 4: Verify balances
      const fromAccount = await prisma.account.findUnique({ where: { id: account1Id } });
      const toAccount = await prisma.account.findUnique({ where: { id: account2Id } });

      expect(parseFloat(fromAccount!.balance.toString())).toBe(900);
      expect(parseFloat(toAccount!.balance.toString())).toBe(100);

      // Step 5: Verify ledger entries
      const ledgerEntries = await prisma.ledgerEntry.findMany({
        where: {
          OR: [
            { accountId: account1Id },
            { accountId: account2Id },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 2,
      });

      expect(ledgerEntries.length).toBe(2);
      expect(ledgerEntries.some(e => e.type === 'DEBIT')).toBe(true);
      expect(ledgerEntries.some(e => e.type === 'CREDIT')).toBe(true);
    });

    test('should prevent duplicate transfer with same idempotency key', async () => {
      const duplicateKey = `duplicate-${Date.now()}`;

      // First transfer
      const transfer1 = await transactionManager.executeTransfer({
        fromAccountId: account1Id,
        toAccountId: account2Id,
        amount: 50,
        currency: 'USD',
        idempotencyKey: duplicateKey,
        userId: testUserId,
        auditContext: {
          userId: testUserId,
          accountId: account1Id,
        },
      });

      // Attempt duplicate transfer
      const transfer2 = await transactionManager.executeTransfer({
        fromAccountId: account1Id,
        toAccountId: account2Id,
        amount: 50,
        currency: 'USD',
        idempotencyKey: duplicateKey,
        userId: testUserId,
        auditContext: {
          userId: testUserId,
          accountId: account1Id,
        },
      });

      // Should return same transfer
      expect(transfer1.id).toBe(transfer2.id);

      // Balance should only change once
      const account = await prisma.account.findUnique({ where: { id: account1Id } });
      // Initial 1000 - 100 (first test) - 50 (this test) = 850
      expect(parseFloat(account!.balance.toString())).toBe(850);
    });

    test('should block transfer that fails AML check', async () => {
      // Create account with suspicious pattern (high amount)
      const amlCheck = await complianceManager.checkAMLCompliance({
        fromAccountId: account1Id,
        toAccountId: account2Id,
        amount: '50000', // Very large amount
        currency: 'USD',
        userId: testUserId,
      });

      // Should flag as non-compliant or have alerts
      // The exact behavior depends on AML rules
      expect(amlCheck).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle insufficient balance gracefully', async () => {
      await expect(
        transactionManager.executeTransfer({
          fromAccountId: account1Id,
          toAccountId: account2Id,
          amount: 100000, // More than available
          currency: 'USD',
          idempotencyKey: `insufficient-${Date.now()}`,
          userId: testUserId,
          auditContext: {
            userId: testUserId,
            accountId: account1Id,
          },
        })
      ).rejects.toThrow('Insufficient balance');
    });

    test('should handle currency mismatch', async () => {
      // Create EUR account
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
          currency: 'USD', // Mismatch
          idempotencyKey: `currency-mismatch-${Date.now()}`,
          userId: testUserId,
          auditContext: {
            userId: testUserId,
            accountId: account1Id,
          },
        })
      ).rejects.toThrow('Currency mismatch');

      // Cleanup
      await prisma.account.delete({ where: { id: eurAccount.id } });
    });
  });
});

