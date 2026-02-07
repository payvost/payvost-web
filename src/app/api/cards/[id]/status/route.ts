import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl } from '@/lib/api/backend';

type StatusAction = 'freeze' | 'unfreeze';

function toLegacyStatus(status: string): 'active' | 'frozen' | 'terminated' {
  const s = String(status || '').toUpperCase();
  if (s === 'ACTIVE') return 'active';
  if (s === 'FROZEN') return 'frozen';
  if (s === 'TERMINATED') return 'terminated';
  return 'active';
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { token } = await requireAuth(request);
    const { id } = await context.params;
    const body = (await request.json()) as { action?: StatusAction };

    const action = body?.action;
    if (!action || (action !== 'freeze' && action !== 'unfreeze')) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const endpoint = action === 'freeze' ? 'freeze' : 'unfreeze';
    const response = await fetch(buildBackendUrl(`/api/v1/cards/${encodeURIComponent(id)}/${endpoint}`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    if (contentType.includes('application/json') && text) {
      const json = JSON.parse(text);
      // Translate v2 status to legacy for older clients hitting /api/cards/.../status
      if (json && typeof json === 'object' && 'status' in json) {
        return NextResponse.json({ ...json, status: toLegacyStatus((json as any).status) }, { status: response.status });
      }
      return NextResponse.json(json, { status: response.status });
    }

    return new NextResponse(text || null, { status: response.status, headers: { 'content-type': contentType || 'text/plain' } });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('PATCH /api/cards/[id]/status proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

