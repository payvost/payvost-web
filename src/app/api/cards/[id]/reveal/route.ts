import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl } from '@/lib/api/backend';

// Legacy reveal route: proxies to /api/v1/cards/:cardId/reveal.
// Returns legacy keys (fullNumber) for compatibility, but never stores PAN/CVV.

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { token } = await requireAuth(req);
    const { id } = await context.params;
    const payload = await req.json().catch(() => ({}));

    const response = await fetch(buildBackendUrl(`/api/v1/cards/${encodeURIComponent(id)}/reveal`), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (contentType.includes('application/json') && text) {
      try {
        const json = JSON.parse(text);
        if (json && typeof json === 'object' && 'pan' in json) {
          return NextResponse.json(
            {
              ...json,
              fullNumber: (json as any).pan,
            },
            { status: response.status, headers: { 'Cache-Control': 'no-store' } }
          );
        }
        return NextResponse.json(json, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
      } catch {
        // Fall through
      }
    }

    return new NextResponse(text || null, {
      status: response.status,
      headers: {
        'content-type': contentType || 'text/plain',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('POST /api/cards/[id]/reveal proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
