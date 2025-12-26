import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { token } = await requireAuth(req);
    const { id } = await params;
    const url = buildBackendUrl(`/api/invoices/${id}/mark-paid`);
    
    console.log(`[mark-paid proxy] Calling backend: ${url}`);
    console.log(`[mark-paid proxy] Invoice ID: ${id}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    // Log response details for debugging
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[mark-paid proxy] Backend error (${response.status}):`, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: response.status });
      } catch {
        return NextResponse.json({ error: errorText || 'Backend error' }, { status: response.status });
      }
    }

    return await backendResponseToNext(response);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('[mark-paid proxy] Proxy error:', error);
    console.error('[mark-paid proxy] Error details:', error instanceof Error ? error.stack : String(error));
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

