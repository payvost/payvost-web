import { backendResponseToNext, buildBackendUrl } from '@/lib/api/backend';

export async function GET(req: Request, ctx: { params: Promise<{ legacyId: string }> }) {
  const { legacyId } = await ctx.params;
  const url = buildBackendUrl(`/api/v1/public/invoices/resolve/${encodeURIComponent(legacyId)}`);
  const response = await fetch(url, { method: 'GET', cache: 'no-store' });
  return backendResponseToNext(response);
}

