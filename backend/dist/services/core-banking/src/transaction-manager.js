"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
const decimal_js_1 = __importDefault(require("decimal.js"));
const audit_logger_1 = require("../../../common/audit-logger");
// Use Decimal from decimal.js - Prisma accepts Decimal instances in v6
const PrismaDecimal = decimal_js_1.default;
class TransactionManager {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Execute a transfer with ACID guarantees
     */
    async executeTransfer(params) {
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
            ? new decimal_js_1.default(dailyTotal._sum.amount.toString()).plus(amount)
            : new decimal_js_1.default(amount);
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
            ? new decimal_js_1.default(monthlyTotal._sum.amount.toString()).plus(amount)
            : new decimal_js_1.default(amount);
        if (monthlySum.greaterThan(mockLimits.monthlyLimit)) {
            throw new Error('Monthly transfer limit exceeded');
        }
        // Execute transfer in transaction
        return await this.prisma.$transaction(async (tx) => {
            // Lock accounts for update
            const accounts = await tx.$queryRaw `
        SELECT id, balance, currency 
        FROM "Account" 
        WHERE id IN (${fromAccountId}, ${toAccountId})
        FOR UPDATE
      `;
            const fromAccount = accounts.find((a) => a.id === fromAccountId);
            const toAccount = accounts.find((a) => a.id === toAccountId);
            if (!fromAccount || !toAccount) {
                throw new Error('One or both accounts not found');
            }
            if (fromAccount.currency !== currency || toAccount.currency !== currency) {
                throw new Error('Currency mismatch');
            }
            const fromBalance = new decimal_js_1.default(fromAccount.balance.toString());
            if (fromBalance.lessThan(amount)) {
                throw new Error('Insufficient balance');
            }
            // Calculate new balances
            const fromNewBalance = fromBalance.minus(amount);
            const toNewBalance = new decimal_js_1.default(toAccount.balance.toString()).plus(amount);
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
                await (0, audit_logger_1.logFinancialTransaction)(audit_logger_1.AuditAction.TRANSFER_COMPLETED, transfer.id, fromAccountId, userId, amount.toString(), currency, description || `Transfer to ${toAccountId}`, auditContext);
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
                            const { onTransactionCompleted } = await Promise.resolve().then(() => __importStar(require('../../referral/transaction-hook')));
                            await onTransactionCompleted(toAccount.userId, amount, currency);
                        }
                        catch (error) {
                            console.error('Error processing referral reward:', error);
                        }
                    });
                }
            }
            catch (error) {
                // Don't fail transaction if referral processing fails
                console.error('Error setting up referral reward processing:', error);
            }
            return transfer;
        });
    }
    generateIdempotencyKey(params) {
        const data = JSON.stringify(params);
        return crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
}
exports.TransactionManager = TransactionManager;
