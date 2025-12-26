import { NextRequest, NextResponse } from 'next/server';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Public endpoint - no auth required
    const { id } = await params;
    const url = buildBackendUrl(`/api/invoices/public/${id}`);

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    });

    return await backendResponseToNext(response);
  } catch (error) {
    console.error('GET /api/invoices/public/[id] proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

