import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function POST(req: NextRequest, context: { params: Promise<{ cardId: string }> }) {
  try {
    const { token } = await requireAuth(req);
    const { cardId } = await context.params;

    const response = await fetch(buildBackendUrl(`/api/v1/cards/${encodeURIComponent(cardId)}/freeze`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    return await backendResponseToNext(response);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('POST /api/v1/cards/[cardId]/freeze proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

