import { backendResponseToNext, buildBackendUrl } from '@/lib/api/backend';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = buildBackendUrl(`/api/v1/invoices/${encodeURIComponent(id)}/issue`);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'authorization': req.headers.get('authorization') || '' },
    cache: 'no-store',
  });
  return backendResponseToNext(response);
}

