import { Router, Response } from 'express';
import Decimal from 'decimal.js';

import { verifyFirebaseToken, requireKYC, AuthenticatedRequest } from '../../gateway/middleware';
import { transactionLimiter } from '../../gateway/rateLimiter';
import { prisma } from '../../common/prisma';
import { validateRequest, payoutSchemas } from '../../common/validation-schemas';

const router = Router();

/**
 * POST /api/payouts
 * Create an external payout (bank beneficiary).
 *
 * Note: Provider execution is intentionally decoupled. This endpoint:
 * - validates ownership and balance,
 * - creates a PaymentOrder + ExternalTransaction record,
 * - debits the source wallet and writes a ledger entry,
 * - returns a canonical payout id for later processing.
 */
router.post(
  '/',
  verifyFirebaseToken,
  requireKYC,
  transactionLimiter,
  validateRequest(payoutSchemas.createPayout),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { fromAccountId, recipientId, amount, currency, description, idempotencyKey } = req.body as any;

      const existing = await prisma.paymentOrder.findFirst({
        where: { userId, type: 'REMITTANCE', idempotencyKey },
        select: { id: true, status: true, externalTxId: true },
      });
      if (existing) {
        return res.status(200).json({
          payout: {
            id: existing.id,
            externalTransactionId: existing.externalTxId || undefined,
            status: existing.status,
          },
        });
      }

      // Ensure source account belongs to the user.
      const fromAccount = await prisma.account.findFirst({
        where: { id: fromAccountId, userId },
        select: { id: true, currency: true },
      });
      if (!fromAccount) {
        return res.status(404).json({ error: 'Source account not found or unauthorized' });
      }
      if (String(fromAccount.currency).toUpperCase() !== String(currency).toUpperCase()) {
        return res.status(400).json({ error: 'Source account currency mismatch' });
      }

      // Ensure beneficiary belongs to the user.
      const recipient = await prisma.recipient.findFirst({
        where: { id: recipientId, userId },
      });
      if (!recipient) {
        return res.status(404).json({ error: 'Beneficiary not found' });
      }

      // Provider routing (MVP).
      const normalizedCountry = String((recipient as any).countryCode || recipient.country || '').toUpperCase();
      const provider =
        normalizedCountry === 'NG' || normalizedCountry === 'NGA' ? 'PAYSTACK' : 'RAPYD';

      // Debit and create records atomically.
      const payout = await prisma.$transaction(async (tx: any) => {
        const locked = await tx.$queryRaw<Array<{ id: string; balance: string; currency: string }>>`
          SELECT id, balance, currency
          FROM "Account"
          WHERE id = ${fromAccountId}
          FOR UPDATE
        `;

        const row = locked[0];
        if (!row) throw new Error('Source account not found');
        if (String(row.currency).toUpperCase() !== String(currency).toUpperCase()) {
          throw new Error('Source account currency mismatch');
        }

        const balance = new Decimal(row.balance.toString());
        const debit = new Decimal(amount);
        if (debit.lte(0)) throw new Error('Invalid amount');
        if (balance.lt(debit)) throw new Error('Insufficient balance');

        const newBalance = balance.minus(debit);

        // Canonical payment order.
        const paymentOrder = await tx.paymentOrder.create({
          data: {
            userId,
            sourceAccountId: fromAccountId,
            type: 'REMITTANCE',
            status: 'SUBMITTED',
            idempotencyKey,
            sourceAmount: debit,
            sourceCurrency: String(currency).toUpperCase(),
            targetAmount: debit,
            targetCurrency: String(currency).toUpperCase(),
            feeAmount: new Decimal(0),
            feeCurrency: String(currency).toUpperCase(),
            provider,
            metadata: {
              recipientId,
              recipientName: recipient.name,
              bankName: recipient.bankName,
              accountLast4: (recipient as any).accountLast4 || undefined,
              countryCode: (recipient as any).countryCode || recipient.country || undefined,
              description: description || undefined,
            },
            submittedAt: new Date(),
          },
          select: { id: true },
        });

        const externalTx = await tx.externalTransaction.create({
          data: {
            userId,
            accountId: fromAccountId,
            provider,
            type: 'PAYOUT',
            status: 'PENDING',
            amount: debit,
            currency: String(currency).toUpperCase(),
            recipientDetails: {
              recipientId,
              recipientName: recipient.name,
              bankName: recipient.bankName,
              accountLast4: (recipient as any).accountLast4 || undefined,
            },
            metadata: {
              paymentOrderId: paymentOrder.id,
              description: description || undefined,
            },
          },
          select: { id: true, status: true },
        });

        await tx.paymentOrder.update({
          where: { id: paymentOrder.id },
          data: { externalTxId: externalTx.id },
        });

        await tx.account.update({
          where: { id: fromAccountId },
          data: { balance: newBalance },
        });

        await tx.ledgerEntry.create({
          data: {
            accountId: fromAccountId,
            amount: debit.neg().toString(),
            balanceAfter: newBalance.toString(),
            type: 'DEBIT',
            description: description || `Payout to ${recipient.name}`,
            referenceId: paymentOrder.id,
          },
        });

        return {
          id: paymentOrder.id,
          externalTransactionId: externalTx.id,
          status: externalTx.status,
        };
      });

      return res.status(201).json({ payout });
    } catch (error: any) {
      console.error('Error creating payout:', error);
      const msg = error?.message || 'Failed to create payout';
      if (msg.includes('Insufficient balance')) return res.status(400).json({ error: msg });
      return res.status(400).json({ error: msg });
    }
  }
);

export default router;

