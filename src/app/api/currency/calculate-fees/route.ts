import { NextRequest, NextResponse } from 'next/server';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';
import { requireAuth } from '@/lib/api/auth';

export async function POST(req: NextRequest) {
  try {
    const { token } = await requireAuth(req);
    const payload = await req.json();

    if (!payload || typeof payload.amount === 'undefined' || !payload.from || !payload.to) {
      return NextResponse.json({ error: 'amount, from, and to are required' }, { status: 400 });
    }

    const response = await fetch(buildBackendUrl('/api/currency/calculate-fees'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    return await backendResponseToNext(response);
  } catch (error: any) {
    console.error('POST /api/currency/calculate-fees proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

