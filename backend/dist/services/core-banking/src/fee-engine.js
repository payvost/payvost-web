"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeEngine = exports.TransactionType = exports.FeeType = void 0;
const decimal_js_1 = require("decimal.js");
// Temporary enums until they're added to Prisma schema
var FeeType;
(function (FeeType) {
    FeeType["FIXED"] = "FIXED";
    FeeType["PERCENTAGE"] = "PERCENTAGE";
    FeeType["HYBRID"] = "HYBRID";
})(FeeType || (exports.FeeType = FeeType = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["INTERNAL_TRANSFER"] = "INTERNAL_TRANSFER";
    TransactionType["EXTERNAL_TRANSFER"] = "EXTERNAL_TRANSFER";
    TransactionType["CARD_PAYMENT"] = "CARD_PAYMENT";
    TransactionType["ATM_WITHDRAWAL"] = "ATM_WITHDRAWAL";
    TransactionType["DEPOSIT"] = "DEPOSIT";
    TransactionType["CURRENCY_EXCHANGE"] = "CURRENCY_EXCHANGE";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
class FeeEngine {
    constructor(prisma) {
        // Temporary in-memory storage until DB tables are created
        this.feeRules = new Map();
        this.appliedFees = new Map();
        this.prisma = prisma;
    }
    /**
     * Calculate fees for a transaction based on applicable rules
     */
    async calculateFees(params) {
        const amount = new decimal_js_1.Decimal(params.amount);
        const { currency, transactionType, fromCountry, toCountry, userTier } = params;
        // Get applicable fee rules from temporary storage
        const feeRules = Array.from(this.feeRules.values()).filter(rule => rule.isActive &&
            rule.currency === currency &&
            rule.transactionType === transactionType &&
            (!rule.country || rule.country === fromCountry || rule.country === toCountry));
        let totalFees = new decimal_js_1.Decimal(0);
        let fixedFees = new decimal_js_1.Decimal(0);
        let percentageFees = new decimal_js_1.Decimal(0);
        let discounts = new decimal_js_1.Decimal(0);
        const appliedRules = [];
        // Apply each fee rule
        for (const rule of feeRules) {
            // Skip if minimum amount requirement not met
            if (rule.minAmount && amount.lessThan(rule.minAmount)) {
                continue;
            }
            // Calculate fee based on rule type
            let ruleFee = new decimal_js_1.Decimal(0);
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
    async createFeeRule(rule) {
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
    async updateFeeRule(id, updates) {
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
    async deactivateFeeRule(id) {
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
    async calculateTierDiscount(tier, amount) {
        const tierDiscounts = {
            'PREMIUM': 0.15, // 15% discount
            'GOLD': 0.10, // 10% discount
            'SILVER': 0.05 // 5% discount
        };
        const discountRate = tierDiscounts[tier] || 0;
        return amount.mul(discountRate);
    }
    /**
     * Record applied fees
     */
    async recordAppliedFees(params) {
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
    async getFeeHistory(accountId, startDate, endDate) {
        return Array.from(this.appliedFees.values()).filter(fee => fee.accountId === accountId &&
            fee.createdAt >= startDate &&
            fee.createdAt <= endDate);
    }
}
exports.FeeEngine = FeeEngine;
