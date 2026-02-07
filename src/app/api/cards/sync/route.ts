import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';

// Deprecated: cards v2 is backed by Postgres and issuer webhooks.
// This endpoint is kept to avoid breaking older clients.

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const scope = request.nextUrl.searchParams.get('scope') || 'me';
    return NextResponse.json({ scope, synced: 0, failed: 0, deprecated: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('POST /api/cards/sync deprecated handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

