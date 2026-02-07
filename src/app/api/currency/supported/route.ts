import { NextRequest, NextResponse } from 'next/server';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function GET(req: NextRequest) {
  try {
    const headers: Record<string, string> = {};

    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const response = await fetch(buildBackendUrl('/api/currency/supported'), {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    return await backendResponseToNext(response);
  } catch (error) {
    console.error('GET /api/currency/supported proxy error:', error);
    return NextResponse.json({ error: 'Unable to fetch supported currencies' }, { status: 502 });
  }
}

