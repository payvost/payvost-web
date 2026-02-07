import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function POST(req: NextRequest, context: { params: Promise<{ cardId: string }> }) {
  try {
    const { token } = await requireAuth(req);
    const { cardId } = await context.params;
    const payload = await req.json().catch(() => ({}));

    const response = await fetch(buildBackendUrl(`/api/v1/cards/${encodeURIComponent(cardId)}/reveal`), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    return await backendResponseToNext(response);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('POST /api/v1/cards/[cardId]/reveal proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

