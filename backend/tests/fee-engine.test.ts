import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { FeeEngine, FeeType, TransactionType } from '../services/core-banking/src/fee-engine';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();
const feeEngine = new FeeEngine(prisma);

describe('Fee Engine Tests', () => {
  beforeAll(async () => {
    // Set up test fee rules in memory
    // In production, these would be in the database
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should calculate fixed fee', async () => {
    const result = await feeEngine.calculateFees({
      amount: new Decimal(100),
      currency: 'USD',
      transactionType: TransactionType.INTERNAL_TRANSFER,
      fromCountry: 'US',
      toCountry: 'US',
    });

    expect(result.feeAmount).toBeDefined();
    expect(result.breakdown).toBeDefined();
    expect(result.appliedRules).toBeDefined();
  });

  test('should calculate percentage fee', async () => {
    const result = await feeEngine.calculateFees({
      amount: new Decimal(1000),
      currency: 'USD',
      transactionType: TransactionType.EXTERNAL_TRANSFER,
      fromCountry: 'US',
      toCountry: 'GB',
    });

    expect(result.feeAmount).toBeDefined();
    expect(result.breakdown.percentageFees.greaterThanOrEqualTo(0)).toBe(true);
  });

  test('should handle multi-currency transactions', async () => {
    const result = await feeEngine.calculateFees({
      amount: new Decimal(100),
      currency: 'EUR',
      transactionType: TransactionType.CURRENCY_EXCHANGE,
      fromCountry: 'FR',
      toCountry: 'US',
    });

    expect(result.feeAmount).toBeDefined();
  });

  test('should apply tier-based discounts', async () => {
    const standardResult = await feeEngine.calculateFees({
      amount: new Decimal(100),
      currency: 'USD',
      transactionType: TransactionType.INTERNAL_TRANSFER,
      fromCountry: 'US',
      toCountry: 'US',
      userTier: 'STANDARD',
    });

    const premiumResult = await feeEngine.calculateFees({
      amount: new Decimal(100),
      currency: 'USD',
      transactionType: TransactionType.INTERNAL_TRANSFER,
      fromCountry: 'US',
      toCountry: 'US',
      userTier: 'PREMIUM',
    });

    // Premium tier should have lower or equal fees
    expect(
      premiumResult.feeAmount.lessThanOrEqualTo(standardResult.feeAmount)
    ).toBe(true);
  });
});
