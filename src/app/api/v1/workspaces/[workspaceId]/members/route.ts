import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function GET(req: NextRequest, ctx: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { token } = await requireAuth(req);
    const { workspaceId } = await ctx.params;
    const response = await fetch(buildBackendUrl(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/members${req.nextUrl.search}`), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return await backendResponseToNext(response);
  } catch (error) {
    if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('GET /api/v1/workspaces/[workspaceId]/members proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { token } = await requireAuth(req);
    const { workspaceId } = await ctx.params;
    const payload = await req.json();
    const response = await fetch(buildBackendUrl(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/members`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    return await backendResponseToNext(response);
  } catch (error) {
    if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('POST /api/v1/workspaces/[workspaceId]/members proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

