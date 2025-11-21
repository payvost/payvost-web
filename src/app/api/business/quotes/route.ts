import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function GET(req: NextRequest) {
  try {
    const { token } = await requireAuth(req);
    const url = buildBackendUrl(`/api/business/quotes${req.nextUrl.search}`);

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

    console.error('GET /api/business/quotes proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await requireAuth(req);
    const body = await req.json();
    const url = buildBackendUrl('/api/business/quotes');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    return await backendResponseToNext(response);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('POST /api/business/quotes proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

