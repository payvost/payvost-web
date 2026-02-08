import { NextRequest } from 'next/server';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function POST(req: NextRequest, { params }: { params: { publicId: string } }) {
  const url = new URL(req.url);
  const t = url.searchParams.get('t') || '';
  const publicId = encodeURIComponent(params.publicId);
  const body = await req.text();

  const resp = await fetch(buildBackendUrl(`/public/payment-links/${publicId}/checkout?t=${encodeURIComponent(t)}`), {
    method: 'POST',
    headers: {
      'Content-Type': req.headers.get('content-type') || 'application/json',
    },
    body,
    cache: 'no-store',
  });
  return backendResponseToNext(resp);
}

