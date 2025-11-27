import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function GET(req: NextRequest) {
  try {
    const { token } = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const currency = searchParams.get('currency');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Build query params
    const queryParams = new URLSearchParams({ userId });
    if (currency) {
      queryParams.append('currency', currency);
    }

    const response = await fetch(buildBackendUrl(`/api/wallet/accounts?${queryParams.toString()}`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    return await backendResponseToNext(response);
  } catch (error: any) {
    console.error('Error fetching user accounts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch accounts' },
      { status: error.status || 500 }
    );
  }
}

