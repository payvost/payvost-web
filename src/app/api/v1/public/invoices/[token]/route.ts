import { backendResponseToNext, buildBackendUrl } from '@/lib/api/backend';

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const url = buildBackendUrl(`/api/v1/public/invoices/${encodeURIComponent(token)}`);
  const response = await fetch(url, { method: 'GET', cache: 'no-store' });
  return backendResponseToNext(response);
}

