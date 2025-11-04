import { NextRequest } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return new Response('Missing id', { status: 400 });

    const backendUrl = `${BACKEND_API_URL}/api/pdf/cache/invoice/${id}`;
    const response = await fetch(backendUrl, { method: 'POST' });

    if (!response.ok) {
      const text = await response.text().catch(() => 'Failed to warm cache');
      return new Response(text, { status: response.status });
    }

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Warm cache error', message: e?.message || String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
