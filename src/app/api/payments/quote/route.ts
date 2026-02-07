import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { backendFetchJson } from '@/lib/api/backend-fetch';

type QuoteType = 'BILL_PAYMENT' | 'GIFT_CARD' | 'REMITTANCE' | 'BULK_ITEM';

export async function POST(req: NextRequest) {
  try {
    const { token, uid } = await requireAuth(req);
    const body = await req.json();

    const type = String(body?.type || '') as QuoteType;
    const sourceAccountId = String(body?.sourceAccountId || '');
    const targetAmount = Number(body?.targetAmount);
    const targetCurrency = String(body?.targetCurrency || '').toUpperCase();
    const userTier = String(body?.userTier || 'STANDARD');

    if (!type || !sourceAccountId || !Number.isFinite(targetAmount) || targetAmount <= 0 || !targetCurrency) {
      return NextResponse.json(
        { error: 'type, sourceAccountId, targetAmount, targetCurrency are required' },
        { status: 400 }
      );
    }

    const accountRes = await backendFetchJson<{ account: { id: string; currency: string } }>(
      token,
      `/api/wallet/accounts/${encodeURIComponent(sourceAccountId)}`,
      { method: 'GET' }
    );

    const sourceCurrency = String(accountRes?.account?.currency || '').toUpperCase();
    if (!sourceCurrency) {
      return NextResponse.json({ error: 'Unable to resolve source account currency' }, { status: 400 });
    }

    const needsConversion = sourceCurrency !== targetCurrency;

    let fxRate = 1;
    if (needsConversion) {
      const rateRes = await backendFetchJson<{ rate: number }>(
        token,
        `/api/currency/rates?from=${encodeURIComponent(sourceCurrency)}&to=${encodeURIComponent(targetCurrency)}`,
        { method: 'GET' }
      );
      fxRate = Number(rateRes?.rate);
      if (!Number.isFinite(fxRate) || fxRate <= 0) {
        return NextResponse.json({ error: 'Exchange rate unavailable' }, { status: 502 });
      }
    }

    // Target amount is expressed in targetCurrency. Convert back to source amount when needed.
    const baseSourceAmount = needsConversion ? targetAmount / fxRate : targetAmount;

    // Fee is calculated on the source amount (pre-fee).
    // For same-currency bill pay we default to zero fee for now (can be made rule-based later).
    let feeAmount = 0;
    if (needsConversion) {
      const feeRes = await backendFetchJson<{ fees: string }>(
        token,
        '/api/currency/calculate-fees',
        {
          method: 'POST',
          body: JSON.stringify({
            amount: baseSourceAmount,
            from: sourceCurrency,
            to: targetCurrency,
            userTier,
          }),
        }
      );
      feeAmount = parseFloat(String(feeRes?.fees || '0')) || 0;
    }

    const sourceAmount = baseSourceAmount + feeAmount;

    return NextResponse.json({
      quote: {
        type,
        userId: uid,
        sourceAccountId,
        sourceCurrency,
        sourceAmount,
        targetCurrency,
        targetAmount,
        feeCurrency: sourceCurrency,
        feeAmount,
        fxRate: needsConversion ? fxRate : null,
        needsConversion,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5m TTL
      },
    });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('POST /api/payments/quote error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

