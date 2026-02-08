import { NextRequest } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { token } = await requireAuth(req);
    const id = encodeURIComponent(params.id);
    const resp = await fetch(buildBackendUrl(`/api/payment-links/${id}/rotate-token`), {
      method: 'POST',
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
    console.error('POST /api/payment-links/[id]/rotate-token proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

