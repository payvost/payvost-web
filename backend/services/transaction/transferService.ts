import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { currencyService } from '../currency-service/src/currencyService';
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
        let targetAmount: Decimal;
        let exchangeRate = new Decimal(1);
        const targetCurrency = toAccount.currency;

        // Handle currency conversion if needed
        if (currency !== targetCurrency) {
            // 3. Get live exchange rate and convert
            const conversionResult = await currencyService.convert(sourceAmount.toNumber(), currency, targetCurrency);
            exchangeRate = conversionResult.rate;
            targetAmount = conversionResult.targetAmount;
        } else {
            targetAmount = sourceAmount;
        }

        // 4. Calculate fees using consolidated logic
        const user = await this.prisma.user.findUnique({
            where: { id: fromAccount.userId },
            select: { userTier: true }
        });

        const feeResult = currencyService.calculateFees(sourceAmount.toNumber(), user?.userTier || 'STANDARD');
        const fees = feeResult.totalFee;

        const totalAmount = sourceAmount.plus(fees);

        return {
            fromAccountId,
            toAccountId: toAccount.id,
            amount: sourceAmount,
            currency,
            targetAmount,
            targetCurrency,
            exchangeRate: exchangeRate,
            feeAmount: fees,
            totalDebitAmount: totalAmount,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins validity
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
        const result = await this.transactionManager.executeTransfer({
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

        // 3. Trigger Notification (Non-blocking)
        setImmediate(async () => {
            try {
                // In a production environment, we would call the notification-processor /send endpoint
                console.log(`[Notification] Sending transfer receipt for ${result.id} to user ${userId}`);
            } catch (error) {
                console.error('[Notification] Failed to send transfer receipt:', error);
            }
        });

        return result;
    }


}
