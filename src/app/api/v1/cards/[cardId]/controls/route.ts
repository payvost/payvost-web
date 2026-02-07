import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function PATCH(req: NextRequest, context: { params: Promise<{ cardId: string }> }) {
  try {
    const { token } = await requireAuth(req);
    const { cardId } = await context.params;
    const payload = await req.json();

    const response = await fetch(buildBackendUrl(`/api/v1/cards/${encodeURIComponent(cardId)}/controls`), {
      method: 'PATCH',
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
    console.error('PATCH /api/v1/cards/[cardId]/controls proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

