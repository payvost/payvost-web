import { NextRequest } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function GET(req: NextRequest) {
  try {
    const { token } = await requireAuth(req);
    const url = new URL(req.url);
    const backendUrl = buildBackendUrl(`/api/payment-links${url.search}`);

    const resp = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    return backendResponseToNext(resp);
  } catch (error: any) {
    if (error instanceof HttpError) {
      return new Response(JSON.stringify({ error: error.message }), { status: error.status });
    }
    console.error('GET /api/payment-links proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await requireAuth(req);
    const body = await req.text(); // preserve JSON as sent from client

    const resp = await fetch(buildBackendUrl('/api/payment-links'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': req.headers.get('content-type') || 'application/json',
      },
      body,
      cache: 'no-store',
    });
    return backendResponseToNext(resp);
  } catch (error: any) {
    if (error instanceof HttpError) {
      return new Response(JSON.stringify({ error: error.message }), { status: error.status });
    }
    console.error('POST /api/payment-links proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

