import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { token } = await requireAuth(req);
    const url = buildBackendUrl(`/api/invoices/${params.id}/mark-paid`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    return await backendResponseToNext(response);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('POST /api/invoices/[id]/mark-paid proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

