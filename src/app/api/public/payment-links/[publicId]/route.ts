import { NextRequest } from 'next/server';
import { buildBackendUrl, backendResponseToNext } from '@/lib/api/backend';

export async function GET(req: NextRequest, { params }: { params: { publicId: string } }) {
  const url = new URL(req.url);
  const t = url.searchParams.get('t') || '';
  const publicId = encodeURIComponent(params.publicId);

  const backendUrl = buildBackendUrl(`/public/payment-links/${publicId}?t=${encodeURIComponent(t)}`);
  const resp = await fetch(backendUrl, { method: 'GET', cache: 'no-store' });
  return backendResponseToNext(resp);
}

