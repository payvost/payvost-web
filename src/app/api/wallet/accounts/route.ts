import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function GET(req: NextRequest) {
  try {
    const { token } = await requireAuth(req);
    const url = buildBackendUrl(`/api/wallet/accounts${req.nextUrl.search}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    return await backendResponseToNext(response);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('GET /api/wallet/accounts proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await requireAuth(req);
    const payload = await req.json();
    const currency = payload?.currency;

    if (!currency || typeof currency !== 'string') {
      return NextResponse.json({ error: 'Currency is required' }, { status: 400 });
    }

    const body = JSON.stringify({
      ...payload,
      currency: currency.toUpperCase(),
    });

    const response = await fetch(buildBackendUrl('/api/wallet/accounts'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
      cache: 'no-store',
    });

    return await backendResponseToNext(response);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('POST /api/wallet/accounts proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
