"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionManager = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const decimal_js_1 = require("decimal.js");
class TransactionManager {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Execute a transfer with ACID guarantees
     */
    async executeTransfer(params) {
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
            ? new decimal_js_1.Decimal(dailyTotal._sum.amount.toString()).plus(amount)
            : new decimal_js_1.Decimal(amount);
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
            ? new decimal_js_1.Decimal(monthlyTotal._sum.amount.toString()).plus(amount)
            : new decimal_js_1.Decimal(amount);
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
            const fromBalance = new decimal_js_1.Decimal(fromAccount.balance.toString());
            if (fromBalance.lessThan(amount)) {
                throw new Error('Insufficient balance');
            }
            // Calculate new balances
            const fromNewBalance = fromBalance.minus(amount);
            const toNewBalance = new decimal_js_1.Decimal(toAccount.balance.toString()).plus(amount);
            // Create transfer record including required `type` field
            const transfer = await tx.transfer.create({
                data: {
                    fromAccountId,
                    toAccountId,
                    amount: new client_1.Prisma.Decimal(amount),
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
                    balance: { decrement: new client_1.Prisma.Decimal(amount) },
                },
            });
            await tx.account.update({
                where: { id: toAccountId },
                data: {
                    balance: { increment: new client_1.Prisma.Decimal(amount) },
                },
            });
            // Create ledger entries - Remove 'transferId' field
            await tx.ledgerEntry.createMany({
                data: [
                    {
                        accountId: fromAccountId,
                        amount: new client_1.Prisma.Decimal(-amount),
                        balanceAfter: new client_1.Prisma.Decimal(fromNewBalance.toString()),
                        type: 'DEBIT',
                        description: `Transfer to ${toAccountId}`,
                    },
                    {
                        accountId: toAccountId,
                        amount: new client_1.Prisma.Decimal(amount),
                        balanceAfter: new client_1.Prisma.Decimal(toNewBalance.toString()),
                        type: 'CREDIT',
                        description: `Transfer from ${fromAccountId}`,
                    },
                ],
            });
            return transfer;
        });
    }
    generateIdempotencyKey(params) {
        const data = JSON.stringify(params);
        return crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
}
exports.TransactionManager = TransactionManager;
