import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

const MAX_TRANSFER_AMOUNT = Number(process.env.MAX_TRANSFER_AMOUNT || 1000000);

export async function POST(req: NextRequest) {
  try {
    const { token } = await requireAuth(req);
    const payload = await req.json();

    const { fromAccountId, toAccountId, toBeneficiaryId, amount, currency, idempotencyKey } = payload ?? {};

    if (!fromAccountId || typeof fromAccountId !== 'string') {
      return NextResponse.json({ error: 'fromAccountId is required' }, { status: 400 });
    }

    if (!toAccountId && !toBeneficiaryId) {
      return NextResponse.json({ error: 'toAccountId or toBeneficiaryId is required' }, { status: 400 });
    }

    if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }

    if (amount > MAX_TRANSFER_AMOUNT) {
      return NextResponse.json({ error: `amount exceeds the maximum allowed value of ${MAX_TRANSFER_AMOUNT}` }, { status: 400 });
    }

    if (!currency || typeof currency !== 'string') {
      return NextResponse.json({ error: 'currency is required' }, { status: 400 });
    }

    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return NextResponse.json({ error: 'idempotencyKey is required' }, { status: 400 });
    }

    const response = await fetch(buildBackendUrl('/api/transaction/transfer'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        ...payload,
        currency: currency.toUpperCase(),
      }),
      cache: 'no-store',
    });

    return await backendResponseToNext(response);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('POST /api/transaction/transfer proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
