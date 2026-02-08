import { NextRequest } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { token } = await requireAuth(req);
    const id = encodeURIComponent(params.id);
    const resp = await fetch(buildBackendUrl(`/api/payment-links/${id}`), {
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
    console.error('GET /api/payment-links/[id] proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { token } = await requireAuth(req);
    const id = encodeURIComponent(params.id);
    const body = await req.text();
    const resp = await fetch(buildBackendUrl(`/api/payment-links/${id}`), {
      method: 'PATCH',
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
    console.error('PATCH /api/payment-links/[id] proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

