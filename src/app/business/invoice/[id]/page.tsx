import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') || 'http';
  const host = h.get('x-forwarded-host') || h.get('host');
  return `${proto}://${host}`;
}

export default async function LegacyBusinessInvoiceLinkPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const base = await getBaseUrl();

  try {
    const res = await fetch(`${base}/api/v1/public/invoices/resolve/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json().catch(() => null) as any;
      if (data?.token) {
        redirect(`/i/${data.token}`);
      }
    }
  } catch {
    // Fall through to friendly message
  }

  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6 bg-muted/10">
      <Card className="max-w-xl w-full">
        <CardHeader className="flex flex-row items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <CardTitle>Invoice Link Updated</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This invoice link has been upgraded to a secure token-based link. Please request a new invoice link from the sender.
        </CardContent>
      </Card>
    </main>
  );
}

