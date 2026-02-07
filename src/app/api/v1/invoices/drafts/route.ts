import { backendResponseToNext, buildBackendUrl } from '@/lib/api/backend';

export async function POST(req: Request) {
  const url = buildBackendUrl('/api/v1/invoices/drafts');
  const body = await req.text();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': req.headers.get('content-type') || 'application/json',
      'authorization': req.headers.get('authorization') || '',
    },
    body,
    cache: 'no-store',
  });

  return backendResponseToNext(response);
}

