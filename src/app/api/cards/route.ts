import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl } from '@/lib/api/backend';

// Legacy compatibility route:
// - Keeps /api/cards working for older clients.
// - Proxies to backend /api/v1/cards (source of truth).
// - Returns a legacy-ish shape (no PAN/CVV persistence).

function toLegacyStatus(status: string): 'active' | 'frozen' | 'terminated' {
  const s = String(status || '').toUpperCase();
  if (s === 'ACTIVE') return 'active';
  if (s === 'FROZEN') return 'frozen';
  if (s === 'TERMINATED') return 'terminated';
  return 'active';
}

function toLegacyNetwork(network: string): 'visa' | 'mastercard' {
  const n = String(network || '').toUpperCase();
  return n === 'MASTERCARD' ? 'mastercard' : 'visa';
}

function toExpiry(expMonth?: number | null, expYear?: number | null): string | undefined {
  if (!expMonth || !expYear) return undefined;
  return `${String(expMonth).padStart(2, '0')}/${String(expYear).slice(-2)}`;
}

async function backendJson(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') && text ? JSON.parse(text) : (text ? { raw: text } : null);
  return { res, data };
}

export async function GET(req: NextRequest) {
  try {
    const { token } = await requireAuth(req);

    const { res, data } = await backendJson(buildBackendUrl(`/api/v1/cards?workspaceType=PERSONAL&limit=200`), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(data || { error: 'Failed to fetch cards' }, { status: res.status });
    }

    const cards = Array.isArray(data?.cards) ? data.cards : [];
    const legacyCards = cards.map((c: any) => ({
      id: c.id,
      cardLabel: c.label,
      last4: c.last4,
      cardType: toLegacyNetwork(c.network),
      expiry: toExpiry(c.expMonth, c.expYear),
      balance: 0,
      currency: c.currency || 'USD',
      theme: 'blue',
      status: toLegacyStatus(c.status),
      maskedNumber: `**** **** **** ${c.last4}`,
      transactions: [],
      spendingLimit: c.controls?.spendLimitAmount
        ? { amount: Number(c.controls.spendLimitAmount), interval: String(c.controls.spendLimitInterval || 'MONTHLY').toLowerCase() }
        : undefined,
      cardModel: 'debit',
      provider: c.provider || 'RAPYD',
      providerCardId: c.providerCardId,
    }));

    return NextResponse.json({ cards: legacyCards }, { status: 200 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('GET /api/cards proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await requireAuth(req);
    const body = await req.json();

    const cardLabel = String(body?.cardLabel || '').trim();
    const cardType = String(body?.cardType || 'visa').toUpperCase();
    const accountId = body?.accountId ? String(body.accountId) : null;

    if (!cardLabel) {
      return NextResponse.json({ error: 'cardLabel is required' }, { status: 400 });
    }

    // Resolve funding account for legacy callers.
    let resolvedAccountId = accountId;
    if (!resolvedAccountId) {
      const { res: accRes, data: accData } = await backendJson(buildBackendUrl('/api/wallet/accounts'), {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!accRes.ok) {
        return NextResponse.json({ error: 'No funding account available for card issuance' }, { status: 400 });
      }
      const accounts = Array.isArray(accData?.accounts) ? accData.accounts : [];
      const personal = accounts.find((a: any) => a.type === 'PERSONAL') || accounts[0];
      resolvedAccountId = personal?.id || null;
    }

    if (!resolvedAccountId) {
      return NextResponse.json({ error: 'Funding account is required' }, { status: 400 });
    }

    const payload = {
      workspaceType: 'PERSONAL',
      accountId: resolvedAccountId,
      label: cardLabel,
      network: cardType === 'MASTERCARD' ? 'MASTERCARD' : 'VISA',
      type: 'VIRTUAL',
      controls: body?.spendingLimit?.amount
        ? { spendLimitAmount: Number(body.spendingLimit.amount), spendLimitInterval: 'MONTHLY' }
        : undefined,
    };

    const { res, data } = await backendJson(buildBackendUrl('/api/v1/cards'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(req.headers.get('idempotency-key') ? { 'Idempotency-Key': req.headers.get('idempotency-key') as string } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(data || { error: 'Failed to create card' }, { status: res.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('POST /api/cards proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

