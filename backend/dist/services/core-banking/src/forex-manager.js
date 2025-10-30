"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForeignExchangeManager = void 0;
const crypto_1 = require("crypto");
class ForeignExchangeManager {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Execute FX conversion between accounts
     */
    async executeForexTransfer({ fromAccountId, toAccountId, fromAmount, fromCurrency, toCurrency, rate, marketRate, spread, metadata = {} }) {
        const toAmount = (Number(fromAmount) * rate).toFixed(8);
        const idempotencyKey = this.generateFxTransferId({
            fromAccountId,
            toAccountId,
            fromAmount,
            fromCurrency,
            toCurrency,
            rate
        });
        return await this.prisma.$transaction(async (tx) => {
            // Mock FX transfer existence check (replace with DB when available)
            // if (idempotencyKey) return { id: 'mock', status: 'COMPLETED' };
            // Lock accounts
            const accounts = await tx.$queryRaw `
        SELECT id, balance, currency, status
        FROM "Account"
        WHERE id IN (${fromAccountId}, ${toAccountId})
        FOR UPDATE
      `;
            const fromAccount = accounts.find((a) => a.id === fromAccountId);
            const toAccount = accounts.find((a) => a.id === toAccountId);
            // Validate accounts and currencies
            if (!fromAccount || !toAccount) {
                throw new Error('Account not found');
            }
            if (fromAccount.currency !== fromCurrency || toAccount.currency !== toCurrency) {
                throw new Error('Currency mismatch');
            }
            if (Number(fromAccount.balance) < Number(fromAmount)) {
                throw new Error('Insufficient balance');
            }
            // Mock FX transfer record (replace with DB when available)
            const fxTransfer = {
                id: 'mock',
                fromAccountId,
                toAccountId,
                fromAmount,
                toAmount,
                fromCurrency,
                toCurrency,
                rate: rate.toString(),
                marketRate: marketRate.toString(),
                spread: spread.toString(),
                status: 'COMPLETED',
                metadata,
                idempotencyKey
            };
            // Update account balances
            await tx.account.update({
                where: { id: fromAccountId },
                data: {
                    balance: { decrement: fromAmount }
                }
            });
            await tx.account.update({
                where: { id: toAccountId },
                data: {
                    balance: { increment: toAmount }
                }
            });
            // Create ledger entries
            await tx.ledgerEntry.createMany({
                data: [
                    {
                        accountId: fromAccountId,
                        amount: `-${fromAmount}`,
                        type: 'DEBIT',
                        balanceAfter: (Number(fromAccount.balance) - Number(fromAmount)).toString(),
                        description: `FX conversion: ${fromCurrency} to ${toCurrency}`
                    },
                    {
                        accountId: toAccountId,
                        amount: toAmount,
                        type: 'CREDIT',
                        balanceAfter: (Number(toAccount.balance) + Number(toAmount)).toString(),
                        description: `FX conversion: ${fromCurrency} to ${toCurrency}`
                    }
                ]
            });
            return fxTransfer;
        });
    }
    /**
     * Get current exchange rate with spread
     */
    async getExchangeRate(fromCurrency, toCurrency) {
        // In a real implementation, this would fetch rates from a provider
        const marketRate = await this.fetchMarketRate(fromCurrency, toCurrency);
        const spread = await this.calculateSpread(fromCurrency, toCurrency);
        const rate = marketRate * (1 - spread);
        return {
            rate,
            marketRate,
            spread
        };
    }
    generateFxTransferId(params) {
        const input = JSON.stringify(params);
        return (0, crypto_1.createHash)('sha256').update(input).digest('hex');
    }
    async fetchMarketRate(fromCurrency, toCurrency) {
        // TODO: Implement real market rate fetching
        return 1.0;
    }
    async calculateSpread(fromCurrency, toCurrency) {
        // TODO: Implement dynamic spread calculation based on:
        // - Currency pair
        // - Transaction volume
        // - Market volatility
        // - Customer tier
        return 0.02; // 2% spread
    }
}
exports.ForeignExchangeManager = ForeignExchangeManager;
