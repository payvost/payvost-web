import { Router, Response } from 'express';
import { StripeProvider } from './providers/stripe';
import { FedNowProvider } from './providers/fednow';
import { SEPAProvider } from './providers/sepa';
import { createPaymentIntent, getPaymentStatus } from './controllers/payment.controller';
import { transactionLimiter } from '../../../gateway/rateLimiter';
import { verifyFirebaseToken, AuthenticatedRequest } from '../../../gateway/middleware';
import Stripe from 'stripe';
import { prisma } from '../../../common/prisma';

const router = Router();

// Payment Intent Creation - Requires authentication and rate limiting
router.post('/create-intent', verifyFirebaseToken, transactionLimiter, createPaymentIntent);
// Compatibility alias for existing frontend usage
router.post('/create-payment-intent', verifyFirebaseToken, transactionLimiter, createPaymentIntent);

// Payment Status Check - Requires authentication
router.get('/status/:paymentId', verifyFirebaseToken, getPaymentStatus);

// Provider-specific routes
router.post('/providers/stripe/webhook', async (req: any, res: Response) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe webhook not configured' });
  }

  const signature = req.headers['stripe-signature'] as string | undefined;
  const rawBody: Buffer | undefined = req.rawBody as Buffer | undefined;

  if (!signature || !rawBody) {
    return res.status(400).json({ error: 'Missing Stripe signature or raw body' });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] signature verification failed:', err?.message || err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const providerRef = pi.id;
      const amount = (pi.amount_received ?? pi.amount) / 100;
      const currency = (pi.currency || 'usd').toUpperCase();
      const metadata = (pi.metadata || {}) as Record<string, string>;

      // Find associated PaymentIntentRecord first (preferred).
      const record = await prisma.paymentIntentRecord.findFirst({
        where: { providerRef },
      });

      const accountId = (metadata.accountId || record?.accountId || '').toString();
      const userId = (metadata.userId || record?.userId || '').toString();

      if (!accountId || accountId === 'unknown') {
        console.warn('[Stripe Webhook] Missing accountId metadata for PI:', providerRef);
      } else {
        // Idempotency: do not credit twice.
        const existingLedger = await prisma.ledgerEntry.findFirst({
          where: { referenceId: providerRef },
          select: { id: true },
        });

        if (!existingLedger) {
          await prisma.$transaction(async (tx: any) => {
            const locked = await tx.$queryRaw<Array<{ id: string; balance: string; currency: string }>>`
              SELECT id, balance, currency
              FROM "Account"
              WHERE id = ${accountId}
              FOR UPDATE
            `;

            const accountData = locked[0];
            if (!accountData) {
              throw new Error('Account not found');
            }
            if (String(accountData.currency).toUpperCase() !== currency) {
              throw new Error('Currency mismatch');
            }

            const currentBalance = parseFloat(accountData.balance);
            const newBalance = (currentBalance + amount).toFixed(8);

            await tx.account.update({
              where: { id: accountId },
              data: { balance: newBalance },
            });

            await tx.ledgerEntry.create({
              data: {
                accountId,
                amount: amount.toString(),
                balanceAfter: newBalance,
                type: 'CREDIT',
                description: 'Card top-up (Stripe)',
                referenceId: providerRef,
              },
            });

            // Note: we rely on ledger entries for the wallet activity feed.
          });

          console.log(`[Stripe Webhook] Credited ${amount} ${currency} to account ${accountId}`);
        }
      }

      // Update payment record status (best-effort).
      if (record) {
        await prisma.paymentIntentRecord.update({
          where: { id: record.id },
          data: {
            status: 'SUCCEEDED',
            metadata: { ...(record.metadata as any), stripe: { ...metadata } },
          },
        });
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

export default router;
