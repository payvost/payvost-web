import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { currencyService } from '../currency-service/src/currencyService';
import { rateSnapshotService, getCrossRateFromSnapshot } from '../currency-service/src/rateSnapshotService';
import { TransactionManager } from '../core-banking/src/transaction-manager';
import { FeeEngine, TransactionType } from '../core-banking/src/fee-engine';
import { AuditLogContext } from '../../common/audit-logger';

export interface TransferQuote {
    id?: string;
    fromAccountId: string;
    toAccountId: string;
    amount: Decimal;
    currency: string;
    targetAmount: Decimal;
    targetCurrency: string;
    exchangeRate: Decimal;
    rateSnapshotId?: string;
    feeAmount: Decimal;
    totalDebitAmount: Decimal;
    expiresAt: Date;
}

const MINOR_UNITS: Record<string, number> = {
    JPY: 0,
    KRW: 0,
    VND: 0,
    KWD: 3,
    BHD: 3,
    OMR: 3,
    JOD: 3,
};

function roundToMinorUnits(amount: Decimal, currency: string): Decimal {
    const decimals = MINOR_UNITS[currency] ?? 2;
    return amount.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
}

function isWeekend(date: Date): boolean {
    const day = date.getUTCDay();
    return day === 0 || day === 6;
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

        const snapshot = await rateSnapshotService.getLatestSnapshotForQuote();

        if (isWeekend(new Date())) {
            const weekendMode = (process.env.FX_WEEKEND_MODE || 'ALLOW').toUpperCase();
            if (weekendMode === 'DISABLE') {
                throw new Error('FX quoting unavailable on weekends');
            }
        }

        // Handle currency conversion using locked snapshot
        if (currency !== targetCurrency) {
            exchangeRate = getCrossRateFromSnapshot(snapshot, currency, targetCurrency);

            const weekendMode = (process.env.FX_WEEKEND_MODE || 'ALLOW').toUpperCase();
            const weekendBufferPct = new Decimal(process.env.FX_WEEKEND_BUFFER_PCT || '0');
            if (weekendMode === 'BUFFER' && isWeekend(new Date())) {
                exchangeRate = exchangeRate.mul(new Decimal(1).minus(weekendBufferPct.div(100)));
            }

            targetAmount = sourceAmount.mul(exchangeRate);
        } else {
            targetAmount = sourceAmount;
        }

        targetAmount = roundToMinorUnits(targetAmount, targetCurrency);

        // 4. Calculate fees using consolidated logic
        const user = await this.prisma.user.findUnique({
            where: { id: fromAccount.userId },
            select: { userTier: true }
        });

        const feeResult = currencyService.calculateFees(sourceAmount.toNumber(), user?.userTier || 'STANDARD');
        const fees = roundToMinorUnits(feeResult.totalFee, currency);

        const totalAmount = roundToMinorUnits(sourceAmount.plus(fees), currency);

        const quote = await this.prisma.fxQuote.create({
            data: {
                userId: params.userId,
                fromAccountId,
                toAccountId: toAccount.id,
                fromCurrency: currency,
                toCurrency: targetCurrency,
                fromAmount: sourceAmount,
                toAmount: targetAmount,
                rateSnapshotId: snapshot.id,
                midRate: exchangeRate,
                feeTotal: fees,
                feeBreakdownJson: {
                    percentageFee: feeResult.percentageFee.toString(),
                    fixedFee: feeResult.fixedFee.toString(),
                },
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                status: 'CREATED',
            },
        });

        return {
            id: quote.id,
            fromAccountId,
            toAccountId: toAccount.id,
            amount: sourceAmount,
            currency,
            targetAmount,
            targetCurrency,
            exchangeRate: exchangeRate,
            rateSnapshotId: snapshot.id,
            feeAmount: fees,
            totalDebitAmount: totalAmount,
            expiresAt: quote.expiresAt,
        };
    }

    /**
     * Execute transfer using a quote
     */
    async executeTransferWithQuote(userId: string, quote: TransferQuote, idempotencyKey?: string, auditContext?: AuditLogContext): Promise<any> {
        let resolvedQuote: TransferQuote = quote;

        if (quote.id && !quote.rateSnapshotId) {
            const storedQuote = await this.prisma.fxQuote.findFirst({
                where: { id: quote.id, userId },
            });

            if (!storedQuote) {
                throw new Error('Quote not found');
            }

            if (storedQuote.status !== 'CREATED') {
                throw new Error(`Quote is ${storedQuote.status.toLowerCase()}`);
            }

            if (new Date(storedQuote.expiresAt).getTime() < Date.now()) {
                await this.prisma.fxQuote.update({
                    where: { id: storedQuote.id },
                    data: { status: 'EXPIRED' },
                });
                throw new Error('Quote has expired');
            }

            resolvedQuote = {
                id: storedQuote.id,
                fromAccountId: storedQuote.fromAccountId,
                toAccountId: storedQuote.toAccountId,
                amount: new Decimal(storedQuote.fromAmount.toString()),
                currency: storedQuote.fromCurrency,
                targetAmount: new Decimal(storedQuote.toAmount.toString()),
                targetCurrency: storedQuote.toCurrency,
                exchangeRate: new Decimal(storedQuote.midRate.toString()),
                rateSnapshotId: storedQuote.rateSnapshotId,
                feeAmount: new Decimal(storedQuote.feeTotal.toString()),
                totalDebitAmount: new Decimal(storedQuote.fromAmount.toString()).plus(storedQuote.feeTotal.toString()),
                expiresAt: storedQuote.expiresAt,
            };
        }

        // Re-verify balance including fees
        const fromAccount = await this.prisma.account.findUnique({ where: { id: resolvedQuote.fromAccountId } });
        if (!fromAccount) throw new Error('Source account not found');

        const balance = new Decimal(fromAccount.balance.toString());
        if (balance.lessThan(resolvedQuote.totalDebitAmount)) {
            throw new Error('Insufficient balance to cover transfer and fees');
        }

        // Execute via transaction manager
        const result = await this.transactionManager.executeTransfer({
            fromAccountId: resolvedQuote.fromAccountId,
            toAccountId: resolvedQuote.toAccountId,
            amount: resolvedQuote.amount.toNumber(),
            currency: resolvedQuote.currency,
            targetAmount: resolvedQuote.targetAmount.toNumber(),
            targetCurrency: resolvedQuote.targetCurrency,
            exchangeRate: resolvedQuote.exchangeRate.toNumber(),
            idempotencyKey,
            userId,
            auditContext,
            description: `Transfer to ${resolvedQuote.toAccountId} (${resolvedQuote.targetCurrency})`
        });

        if (resolvedQuote.id) {
            await this.prisma.fxQuote.update({
                where: { id: resolvedQuote.id },
                data: { status: 'ACCEPTED', acceptedAt: new Date() },
            });
        }

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
