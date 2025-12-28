import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { TransactionManager } from '../core-banking/src/transaction-manager';
import { FeeEngine, TransactionType } from '../core-banking/src/fee-engine';
import { AuditLogContext } from '../../common/audit-logger';

export interface TransferQuote {
    fromAccountId: string;
    toAccountId: string;
    amount: Decimal;
    currency: string;
    targetAmount: Decimal;
    targetCurrency: string;
    exchangeRate: Decimal;
    feeAmount: Decimal;
    totalDebitAmount: Decimal;
    expiresAt: Date;
}

export class TransferService {
    private prisma: PrismaClient;
    private transactionManager: TransactionManager;
    private feeEngine: FeeEngine;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
        this.transactionManager = new TransactionManager(prisma);
        this.feeEngine = new FeeEngine(prisma);
    }

    /**
     * Get a transfer quote
     */
    async getQuote(params: {
        userId: string;
        fromAccountId: string;
        toAccountId?: string;
        toUserId?: string;
        amount: number;
        currency: string;
    }): Promise<TransferQuote> {
        const { fromAccountId, toAccountId, toUserId, amount, currency } = params;

        // Fetch accounts
        const fromAccount = await this.prisma.account.findUnique({ where: { id: fromAccountId } });

        let toAccount;
        if (toAccountId) {
            toAccount = await this.prisma.account.findUnique({ where: { id: toAccountId } });
        } else if (toUserId) {
            // Find recipient's primary account (first one created)
            toAccount = await this.prisma.account.findFirst({
                where: { userId: toUserId },
                orderBy: { createdAt: 'asc' }
            });
        }

        if (!fromAccount || !toAccount) {
            throw new Error('One or both accounts not found');
        }

        if (fromAccount.userId !== params.userId) {
            throw new Error('Unauthorized account access');
        }

        const sourceAmount = new Decimal(amount);
        let targetAmount = sourceAmount;
        let exchangeRate = new Decimal(1);
        const targetCurrency = toAccount.currency;

        // Handle currency conversion if needed
        if (currency !== targetCurrency) {
            // Mock rate logic similar to currency-service
            exchangeRate = this.getMockExchangeRate(currency, targetCurrency);
            targetAmount = sourceAmount.mul(exchangeRate);
        }

        // Calculate fees
        const feeCalculation = await this.feeEngine.calculateFees({
            amount: sourceAmount,
            currency,
            transactionType: TransactionType.INTERNAL_TRANSFER,
            fromCountry: 'US', // Default for now
            toCountry: 'US',
        });

        const feeAmount = feeCalculation.feeAmount;
        const totalDebitAmount = sourceAmount.plus(feeAmount);

        return {
            fromAccountId,
            toAccountId: toAccount.id,
            amount: sourceAmount,
            currency,
            targetAmount,
            targetCurrency,
            exchangeRate,
            feeAmount,
            totalDebitAmount,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes validity
        };
    }

    /**
     * Execute transfer using a quote
     */
    async executeTransferWithQuote(userId: string, quote: TransferQuote, idempotencyKey?: string, auditContext?: AuditLogContext): Promise<any> {
        // Re-verify balance including fees
        const fromAccount = await this.prisma.account.findUnique({ where: { id: quote.fromAccountId } });
        if (!fromAccount) throw new Error('Source account not found');

        const balance = new Decimal(fromAccount.balance.toString());
        if (balance.lessThan(quote.totalDebitAmount)) {
            throw new Error('Insufficient balance to cover transfer and fees');
        }

        // Execute via transaction manager
        return await this.transactionManager.executeTransfer({
            fromAccountId: quote.fromAccountId,
            toAccountId: quote.toAccountId,
            amount: quote.amount.toNumber(),
            currency: quote.currency,
            targetAmount: quote.targetAmount.toNumber(),
            targetCurrency: quote.targetCurrency,
            exchangeRate: quote.exchangeRate.toNumber(),
            idempotencyKey,
            userId,
            auditContext,
            description: `Transfer to ${quote.toAccountId} (${quote.targetCurrency})`
        });
    }

    private getMockExchangeRate(from: string, to: string): Decimal {
        const rates: Record<string, Decimal> = {
            USD: new Decimal(1),
            EUR: new Decimal(0.92),
            GBP: new Decimal(0.79),
            NGN: new Decimal(1580),
            GHS: new Decimal(15.5),
            KES: new Decimal(150),
            ZAR: new Decimal(18.5),
        };

        if (from === to) return new Decimal(1);

        const fromRate = rates[from] || new Decimal(1);
        const toRate = rates[to] || new Decimal(1);

        return toRate.div(fromRate);
    }
}
