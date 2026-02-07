import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import reloadlyService from '@/server/reloadly';
import { backendFetchJson } from '@/lib/api/backend-fetch';

type SubmitType = 'BILL_PAYMENT' | 'GIFT_CARD';

function toUpperCurrency(value: unknown): string {
  return String(value || '').trim().toUpperCase();
}

function cronForFrequency(freq: 'weekly' | 'monthly' | 'yearly'): string {
  // Default schedule: 09:00 UTC.
  // weekly: Mondays 09:00
  if (freq === 'weekly') return '0 9 * * 1';
  // monthly: 1st of month 09:00
  if (freq === 'monthly') return '0 9 1 * *';
  // yearly: Jan 1st 09:00
  return '0 9 1 1 *';
}

function nextRunFromFrequency(freq: 'weekly' | 'monthly' | 'yearly'): Date {
  const now = new Date();
  const next = new Date(now);
  if (freq === 'weekly') {
    // next Monday 09:00 UTC
    const day = next.getUTCDay(); // 0=Sun
    const delta = (8 - day) % 7 || 7;
    next.setUTCDate(next.getUTCDate() + delta);
    next.setUTCHours(9, 0, 0, 0);
    return next;
  }
  if (freq === 'monthly') {
    next.setUTCMonth(next.getUTCMonth() + 1, 1);
    next.setUTCHours(9, 0, 0, 0);
    return next;
  }
  next.setUTCFullYear(next.getUTCFullYear() + 1, 0, 1);
  next.setUTCHours(9, 0, 0, 0);
  return next;
}

async function computeQuote(params: {
  token: string;
  sourceAccountId: string;
  targetAmount: number;
  targetCurrency: string;
  userTier: string;
}) {
  const accountRes = await backendFetchJson<{ account: { id: string; currency: string } }>(
    params.token,
    `/api/wallet/accounts/${encodeURIComponent(params.sourceAccountId)}`,
    { method: 'GET' }
  );

  const sourceCurrency = toUpperCurrency(accountRes?.account?.currency);
  if (!sourceCurrency) throw new Error('Unable to resolve source account currency');

  const needsConversion = sourceCurrency !== params.targetCurrency;

  let fxRate = 1;
  if (needsConversion) {
    const rateRes = await backendFetchJson<{ rate: number }>(
      params.token,
      `/api/currency/rates?from=${encodeURIComponent(sourceCurrency)}&to=${encodeURIComponent(params.targetCurrency)}`,
      { method: 'GET' }
    );
    fxRate = Number(rateRes?.rate);
    if (!Number.isFinite(fxRate) || fxRate <= 0) throw new Error('Exchange rate unavailable');
  }

  const baseSourceAmount = needsConversion ? params.targetAmount / fxRate : params.targetAmount;

  let feeAmount = 0;
  if (needsConversion) {
    const feeRes = await backendFetchJson<{ fees: string }>(params.token, '/api/currency/calculate-fees', {
      method: 'POST',
      body: JSON.stringify({
        amount: baseSourceAmount,
        from: sourceCurrency,
        to: params.targetCurrency,
        userTier: params.userTier,
      }),
    });
    feeAmount = parseFloat(String(feeRes?.fees || '0')) || 0;
  }

  const sourceAmount = baseSourceAmount + feeAmount;

  return {
    sourceCurrency,
    sourceAmount,
    feeCurrency: sourceCurrency,
    feeAmount,
    needsConversion,
    fxRate: needsConversion ? fxRate : null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { token, uid } = await requireAuth(req);
    const body = await req.json();

    const type = String(body?.type || '') as SubmitType;
    const idempotencyKey = String(body?.idempotencyKey || '').trim();
    const sourceAccountId = String(body?.sourceAccountId || '').trim();
    const targetAmount = Number(body?.targetAmount);
    const targetCurrency = toUpperCurrency(body?.targetCurrency);
    const userTier = String(body?.userTier || 'STANDARD');
    const details = body?.details || {};
    const schedule = body?.schedule || null;

    if (!type || (type !== 'BILL_PAYMENT' && type !== 'GIFT_CARD')) {
      return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
    }
    if (!idempotencyKey) {
      return NextResponse.json({ error: 'idempotencyKey is required' }, { status: 400 });
    }
    if (!sourceAccountId) {
      return NextResponse.json({ error: 'sourceAccountId is required' }, { status: 400 });
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      return NextResponse.json({ error: 'targetAmount must be a positive number' }, { status: 400 });
    }
    if (!targetCurrency) {
      return NextResponse.json({ error: 'targetCurrency is required' }, { status: 400 });
    }

    const existing = await prisma.paymentOrder.findUnique({
      where: { userId_type_idempotencyKey: { userId: uid, type: type as any, idempotencyKey } },
      include: { attempts: true },
    });
    if (existing) {
      return NextResponse.json({ paymentOrder: existing, idempotent: true });
    }

    const quote = await computeQuote({
      token,
      sourceAccountId,
      targetAmount,
      targetCurrency,
      userTier,
    });

    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        userId: uid,
        sourceAccountId,
        type: type as any,
        status: 'SUBMITTED',
        idempotencyKey,
        sourceAmount: quote.sourceAmount,
        sourceCurrency: quote.sourceCurrency,
        targetAmount,
        targetCurrency,
        feeAmount: quote.feeAmount,
        feeCurrency: quote.feeCurrency,
        fxRate: quote.fxRate ?? undefined,
        fxProvider: quote.needsConversion ? 'INTERNAL' : null,
        submittedAt: new Date(),
        metadata: details,
        provider: 'RELOADLY',
      },
    });

    const attempt = await prisma.paymentAttempt.create({
      data: {
        paymentOrderId: paymentOrder.id,
        provider: 'RELOADLY',
        status: 'CREATED',
      },
    });

    const debitReferenceId = `po:${paymentOrder.id}:debit`;
    await backendFetchJson<{ success: boolean }>(token, '/api/wallet/deduct', {
      method: 'POST',
      body: JSON.stringify({
        accountId: sourceAccountId,
        amount: quote.sourceAmount,
        currency: quote.sourceCurrency,
        description: `${type === 'BILL_PAYMENT' ? 'Bill payment' : 'Gift card purchase'} (${paymentOrder.id})`,
        referenceId: debitReferenceId,
      }),
    });

    // Provider request
    const customIdentifier = `po_${paymentOrder.id}`;

    try {
      if (type === 'BILL_PAYMENT') {
        const billerId = Number(details?.billerId);
        const subscriberAccountNumber = String(details?.subscriberAccountNumber || '');

        if (!Number.isFinite(billerId) || !subscriberAccountNumber) {
          throw new Error('details.billerId and details.subscriberAccountNumber are required');
        }

        const result = await reloadlyService.payBill({
          billerId,
          subscriberAccountNumber,
          amount: targetAmount,
          customIdentifier,
          referenceId: paymentOrder.id,
        });

        const providerRef = result?.transactionId ? String(result.transactionId) : null;

        await prisma.paymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'SUBMITTED',
            providerRef: providerRef || undefined,
          },
        });

        // Create provider transaction log immediately (so webhook updates it).
        let externalTxId: string | null = null;
        if (providerRef) {
          const externalTx = await prisma.externalTransaction.upsert({
            where: { providerTransactionId: providerRef },
            update: {
              userId: uid,
              accountId: sourceAccountId,
              provider: 'RELOADLY',
              type: 'BILL_PAYMENT',
              amount: targetAmount as any,
              currency: targetCurrency,
              status: result.deliveryStatus === 'SUCCESSFUL' ? 'COMPLETED' : 'PROCESSING',
              recipientDetails: {
                billerId,
                subscriberAccountNumber,
              },
              metadata: {
                paymentOrderId: paymentOrder.id,
                customIdentifier,
                ...details,
              },
            },
            create: {
              userId: uid,
              accountId: sourceAccountId,
              provider: 'RELOADLY',
              providerTransactionId: providerRef,
              type: 'BILL_PAYMENT',
              amount: targetAmount as any,
              currency: targetCurrency,
              status: result.deliveryStatus === 'SUCCESSFUL' ? 'COMPLETED' : 'PROCESSING',
              recipientDetails: {
                billerId,
                subscriberAccountNumber,
              },
              metadata: {
                paymentOrderId: paymentOrder.id,
                customIdentifier,
                ...details,
              },
            },
          });
          externalTxId = externalTx.id;
        }

        // Best-effort template upsert (Prisma; replaces Firestore billTemplates)
        await prisma.paymentTemplate.upsert({
          where: {
            userId_type_provider_providerEntityId: {
              userId: uid,
              type: 'BILL_PAYMENT',
              provider: 'RELOADLY',
              providerEntityId: String(billerId),
            },
          },
          update: {
            fields: {
              billerName: String(details?.billerName || ''),
              subscriberAccountNumber,
              targetCurrency,
            },
            lastUsedAt: new Date(),
          },
          create: {
            userId: uid,
            type: 'BILL_PAYMENT',
            provider: 'RELOADLY',
            providerEntityId: String(billerId),
            fields: {
              billerName: String(details?.billerName || ''),
              subscriberAccountNumber,
              targetCurrency,
            },
            lastUsedAt: new Date(),
          },
        });

        // Optional schedule creation (Prisma; replaces Firestore recurringBills)
        if (schedule?.enabled) {
          const freq = String(schedule?.frequency || 'monthly') as 'weekly' | 'monthly' | 'yearly';
          await prisma.paymentSchedule.create({
            data: {
              userId: uid,
              type: 'BILL_PAYMENT',
              status: 'ACTIVE',
              timezone: String(schedule?.timezone || 'UTC'),
              cron: cronForFrequency(freq),
              nextRunAt: nextRunFromFrequency(freq),
              metadata: {
                paymentOrderId: paymentOrder.id,
                sourceAccountId,
                billerId,
                subscriberAccountNumber,
                targetAmount,
                targetCurrency,
              },
            },
          });
        }

        const updated = await prisma.paymentOrder.update({
          where: { id: paymentOrder.id },
          data: {
            status: result.deliveryStatus === 'SUCCESSFUL' ? 'COMPLETED' : 'PROCESSING',
            providerRef: providerRef || undefined,
            externalTxId: externalTxId || undefined,
            completedAt: result.deliveryStatus === 'SUCCESSFUL' ? new Date() : undefined,
          },
          include: { attempts: true },
        });

        return NextResponse.json({ paymentOrder: updated });
      }

      // Gift card submit (minimal wiring; redemption details handled via webhook/provider polling later).
      if (type === 'GIFT_CARD') {
        const productId = Number(details?.productId);
        const countryCode = String(details?.countryCode || '');
        const quantity = Number(details?.quantity || 1);
        const unitPrice = Number(details?.unitPrice);
        const recipientEmail = details?.recipientEmail ? String(details.recipientEmail) : undefined;

        if (!Number.isFinite(productId) || !countryCode || !Number.isFinite(unitPrice)) {
          throw new Error('details.productId, details.countryCode, details.unitPrice are required');
        }

        const result = await reloadlyService.orderGiftCard({
          productId,
          countryCode,
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
          unitPrice,
          recipientEmail,
          customIdentifier,
        });

        const providerRef = result?.transactionId ? String(result.transactionId) : null;

        await prisma.paymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'SUBMITTED',
            providerRef: providerRef || undefined,
          },
        });

        let externalTxId: string | null = null;
        if (providerRef) {
          const externalTx = await prisma.externalTransaction.upsert({
            where: { providerTransactionId: providerRef },
            update: {
              userId: uid,
              accountId: sourceAccountId,
              provider: 'RELOADLY',
              type: 'GIFT_CARD',
              amount: targetAmount as any,
              currency: targetCurrency,
              status: 'PROCESSING',
              metadata: {
                paymentOrderId: paymentOrder.id,
                customIdentifier,
                ...details,
              },
            },
            create: {
              userId: uid,
              accountId: sourceAccountId,
              provider: 'RELOADLY',
              providerTransactionId: providerRef,
              type: 'GIFT_CARD',
              amount: targetAmount as any,
              currency: targetCurrency,
              status: 'PROCESSING',
              metadata: {
                paymentOrderId: paymentOrder.id,
                customIdentifier,
                ...details,
              },
            },
          });
          externalTxId = externalTx.id;
        }

        await prisma.paymentTemplate.upsert({
          where: {
            userId_type_provider_providerEntityId: {
              userId: uid,
              type: 'GIFT_CARD',
              provider: 'RELOADLY',
              providerEntityId: String(productId),
            },
          },
          update: {
            fields: { countryCode, recipientEmail },
            lastUsedAt: new Date(),
          },
          create: {
            userId: uid,
            type: 'GIFT_CARD',
            provider: 'RELOADLY',
            providerEntityId: String(productId),
            fields: { countryCode, recipientEmail },
            lastUsedAt: new Date(),
          },
        });

        const updated = await prisma.paymentOrder.update({
          where: { id: paymentOrder.id },
          data: {
            status: 'PROCESSING',
            providerRef: providerRef || undefined,
            externalTxId: externalTxId || undefined,
          },
          include: { attempts: true },
        });

        return NextResponse.json({ paymentOrder: updated });
      }

      return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
    } catch (providerError: any) {
      const refundReferenceId = `po:${paymentOrder.id}:refund`;
      try {
        await backendFetchJson<{ success: boolean }>(token, '/api/wallet/refund', {
          method: 'POST',
          body: JSON.stringify({
            accountId: sourceAccountId,
            amount: quote.sourceAmount,
            currency: quote.sourceCurrency,
            description: `Refund for failed ${type} (${paymentOrder.id})`,
            referenceId: refundReferenceId,
          }),
        });
      } catch (refundErr) {
        console.error('[payments.submit] refund failed:', refundErr);
      }

      await prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'FAILED',
          errorMessage: providerError?.message ? String(providerError.message) : 'Provider request failed',
        },
      });

      const updated = await prisma.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: {
          status: 'FAILED',
          errorMessage: providerError?.message ? String(providerError.message) : 'Provider request failed',
        },
        include: { attempts: true },
      });

      return NextResponse.json(
        { error: updated.errorMessage || 'Payment submit failed', paymentOrder: updated },
        { status: 502 }
      );
    }
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('POST /api/payments/submit error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
