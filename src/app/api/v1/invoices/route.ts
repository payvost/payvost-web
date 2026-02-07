import { backendResponseToNext, buildBackendUrl } from '@/lib/api/backend';

export async function GET(req: Request) {
  const url = buildBackendUrl(`/api/v1/invoices${new URL(req.url).search}`);
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'authorization': req.headers.get('authorization') || '' },
    cache: 'no-store',
  });
  return backendResponseToNext(response);
}

