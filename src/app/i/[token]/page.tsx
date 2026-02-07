'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, Download, AlertTriangle } from 'lucide-react';
import { InvoiceDisplay } from '@/components/invoice-display';
import { useToast } from '@/hooks/use-toast';

export default function PublicInvoiceTokenPage() {
  const params = useParams();
  const token = params.token as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/public/invoices/${encodeURIComponent(token)}`, { cache: 'no-store' });
        if (!res.ok) {
          const msg = await res.text().catch(() => '');
          throw new Error(msg || `Failed to load invoice (${res.status})`);
        }
        const data = await res.json();
        if (cancelled) return;
        setInvoice(data);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Failed to load invoice');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  const invoiceId = invoice?.id as string | undefined;

  const handlePrint = () => {
    if (!invoiceId) return;
    const pdfUrl = `/api/pdf/invoice/${invoiceId}?token=${encodeURIComponent(token)}`;
    window.open(pdfUrl, '_blank');
    toast({
      title: 'Opening PDF',
      description: 'The invoice PDF will open in a new window. Use the print button in the PDF viewer.',
    });
  };

  const handleDownload = () => {
    if (!invoiceId) return;
    const downloadUrl = `/api/pdf/invoice/${invoiceId}?token=${encodeURIComponent(token)}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `invoice-${invoiceId}.pdf`;
    link.click();
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/10">
      <SiteHeader />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}

          {!loading && error && (
            <Card className="max-w-3xl mx-auto">
              <CardHeader className="flex flex-row items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <div className="font-semibold">Invoice Not Available</div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {error}
              </CardContent>
            </Card>
          )}

          {!loading && !error && invoice && (
            <>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
              </div>

              <Card className="max-w-5xl mx-auto">
                <CardContent className="p-0">
                  <InvoiceDisplay invoice={invoice} showActionButtons={false} />
                </CardContent>
                <CardFooter className="bg-muted/50 p-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Secure invoice link
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {String(invoice.status || '')}
                  </Badge>
                </CardFooter>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
