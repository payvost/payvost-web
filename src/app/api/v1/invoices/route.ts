import { backendResponseToNext, buildBackendUrl } from '@/lib/api/backend';

export async function GET(req: Request) {
  // Backend versioned invoice routes are mounted under `/api/invoices` (unversioned).
  const url = buildBackendUrl(`/api/invoices${new URL(req.url).search}`);
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'authorization': req.headers.get('authorization') || '' },
    cache: 'no-store',
  });
  return backendResponseToNext(response);
}
