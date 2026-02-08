import { backendResponseToNext, buildBackendUrl } from '@/lib/api/backend';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = buildBackendUrl(`/api/invoices/${encodeURIComponent(id)}/void`);
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
