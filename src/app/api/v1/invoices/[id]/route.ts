import { backendResponseToNext, buildBackendUrl } from '@/lib/api/backend';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = buildBackendUrl(`/api/v1/invoices/${encodeURIComponent(id)}`);
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'authorization': req.headers.get('authorization') || '' },
    cache: 'no-store',
  });
  return backendResponseToNext(response);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = buildBackendUrl(`/api/v1/invoices/${encodeURIComponent(id)}`);
  const body = await req.text();
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'content-type': req.headers.get('content-type') || 'application/json',
      'authorization': req.headers.get('authorization') || '',
    },
    body,
    cache: 'no-store',
  });
  return backendResponseToNext(response);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = buildBackendUrl(`/api/v1/invoices/${encodeURIComponent(id)}`);
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'authorization': req.headers.get('authorization') || '' },
    cache: 'no-store',
  });
  return backendResponseToNext(response);
}

