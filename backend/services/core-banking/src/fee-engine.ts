import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

// Temporary enums until they're added to Prisma schema
export enum FeeType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
  HYBRID = 'HYBRID'
}

export enum TransactionType {
  INTERNAL_TRANSFER = 'INTERNAL_TRANSFER',
  EXTERNAL_TRANSFER = 'EXTERNAL_TRANSFER',
  CARD_PAYMENT = 'CARD_PAYMENT',
  ATM_WITHDRAWAL = 'ATM_WITHDRAWAL',
  DEPOSIT = 'DEPOSIT',
  CURRENCY_EXCHANGE = 'CURRENCY_EXCHANGE'
}

interface FeeRule {
  id: string;
  name: string;
  description: string;
  feeType: FeeType;
  transactionType: TransactionType;
  currency: string;
  fixedAmount?: Decimal;
  percentageRate?: Decimal;
  minAmount?: Decimal;
  maxAmount?: Decimal;
  country?: string;
  isActive: boolean;
}

interface FeeCalculationResult {
  feeAmount: Decimal;
  appliedRules: FeeRule[];
  breakdown: {
    fixedFees: Decimal;
    percentageFees: Decimal;
    discounts: Decimal;
    total: Decimal;
  };
}

export class FeeEngine {
  private prisma: PrismaClient;
  // Temporary in-memory storage until DB tables are created
  private feeRules: Map<string, FeeRule> = new Map();
  private appliedFees: Map<string, any> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Calculate fees for a transaction based on applicable rules
   */
  async calculateFees(params: {
    amount: Decimal | string | number;
    currency: string;
    transactionType: TransactionType;
    fromCountry: string;
    toCountry: string;
    userTier?: string;
  }): Promise<FeeCalculationResult> {
    const amount = new Decimal(params.amount);
    const { currency, transactionType, fromCountry, toCountry, userTier } = params;

    // Get applicable fee rules from temporary storage
    const feeRules = Array.from(this.feeRules.values()).filter(rule => 
      rule.isActive && 
      rule.currency === currency && 
      rule.transactionType === transactionType &&
      (!rule.country || rule.country === fromCountry || rule.country === toCountry)
    );

    let totalFees = new Decimal(0);
    let fixedFees = new Decimal(0);
    let percentageFees = new Decimal(0);
    let discounts = new Decimal(0);
    const appliedRules: FeeRule[] = [];

    // Apply each fee rule
    for (const rule of feeRules) {
      // Skip if minimum amount requirement not met
      if (rule.minAmount && amount.lessThan(rule.minAmount)) {
        continue;
      }

      // Calculate fee based on rule type
      let ruleFee = new Decimal(0);

      if (rule.fixedAmount) {
        ruleFee = ruleFee.plus(rule.fixedAmount);
        fixedFees = fixedFees.plus(rule.fixedAmount);
      }

      if (rule.percentageRate) {
        const percentageFee = amount.mul(rule.percentageRate).div(100);
        ruleFee = ruleFee.plus(percentageFee);
        percentageFees = percentageFees.plus(percentageFee);
      }

      // Apply maximum fee cap if exists
      if (rule.maxAmount && ruleFee.greaterThan(rule.maxAmount)) {
        const excess = ruleFee.minus(rule.maxAmount);
        ruleFee = rule.maxAmount;
        discounts = discounts.plus(excess);
      }

      totalFees = totalFees.plus(ruleFee);
      appliedRules.push(rule);
    }

    // Apply tier-based discounts if applicable
    if (userTier) {
      const tierDiscount = await this.calculateTierDiscount(userTier, totalFees);
      discounts = discounts.plus(tierDiscount);
      totalFees = totalFees.minus(tierDiscount);
    }

    return {
      feeAmount: totalFees,
      appliedRules,
      breakdown: {
        fixedFees,
        percentageFees,
        discounts,
        total: totalFees
      }
    };
  }

  /**
   * Create a new fee rule
   */
  async createFeeRule(rule: Omit<FeeRule, 'id'>): Promise<FeeRule> {
    const id = crypto.randomUUID();
    const newRule = {
      ...rule,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.feeRules.set(id, newRule);
    return newRule;
  }

  /**
   * Update an existing fee rule
   */
  async updateFeeRule(id: string, updates: Partial<Omit<FeeRule, 'id'>>): Promise<FeeRule> {
    const existingRule = this.feeRules.get(id);
    if (!existingRule) {
      throw new Error('Fee rule not found');
    }

    const updatedRule = {
      ...existingRule,
      ...updates,
      updatedAt: new Date()
    };
    this.feeRules.set(id, updatedRule);
    return updatedRule;
  }

  /**
   * Deactivate a fee rule
   */
  async deactivateFeeRule(id: string): Promise<FeeRule> {
    const existingRule = this.feeRules.get(id);
    if (!existingRule) {
      throw new Error('Fee rule not found');
    }

    const updatedRule = {
      ...existingRule,
      isActive: false,
      updatedAt: new Date()
    };
    this.feeRules.set(id, updatedRule);
    return updatedRule;
  }

  /**
   * Calculate tier-based discount
   */
  private async calculateTierDiscount(tier: string, amount: Decimal): Promise<Decimal> {
    const tierDiscounts = {
      'PREMIUM': 0.15, // 15% discount
      'GOLD': 0.10,    // 10% discount
      'SILVER': 0.05   // 5% discount
    };

    const discountRate = tierDiscounts[tier as keyof typeof tierDiscounts] || 0;
    return amount.mul(discountRate);
  }

  /**
   * Record applied fees
   */
  async recordAppliedFees(params: {
    transactionId: string;
    fees: FeeCalculationResult;
    accountId: string;
  }): Promise<void> {
    const { transactionId, fees, accountId } = params;
    const id = crypto.randomUUID();

    this.appliedFees.set(id, {
      id,
      transactionId,
      accountId,
      amount: fees.feeAmount.toString(),
      breakdownJson: JSON.stringify(fees.breakdown),
      appliedRules: fees.appliedRules.map(rule => ({
        id: crypto.randomUUID(),
        feeRuleId: rule.id,
        amount: rule.fixedAmount?.toString() || '0',
        percentageRate: rule.percentageRate?.toString() || '0'
      })),
      createdAt: new Date()
    });
  }

  /**
   * Get fee history for an account
   */
  async getFeeHistory(accountId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return Array.from(this.appliedFees.values()).filter(fee => 
      fee.accountId === accountId &&
      fee.createdAt >= startDate &&
      fee.createdAt <= endDate
    );
  }
}