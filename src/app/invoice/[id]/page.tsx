'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc, DocumentData, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import StripeCheckout from '@/components/StripeCheckout';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, AlertTriangle, Loader2, FileText, Printer, Download, Share2, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import Image from 'next/image';

type Status = 'Paid' | 'Pending' | 'Overdue' | 'Draft';

const statusInfo: { [key in Status]: { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
  Paid: { icon: <CheckCircle className="h-5 w-5" />, variant: 'default' },
  Pending: { icon: <Clock className="h-5 w-5" />, variant: 'secondary' },
  Overdue: { icon: <AlertTriangle className="h-5 w-5" />, variant: 'destructive' },
  Draft: { icon: <FileText className="h-5 w-5" />, variant: 'outline' },
};

const currencySymbols: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
};

export default function PublicInvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<DocumentData | null>(null);
  const [businessProfile, setBusinessProfile] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [foundInCollection, setFoundInCollection] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();
  const [isManualPaymentDialogOpen, setIsManualPaymentDialogOpen] = useState(false);

  // Check if this page is being rendered for PDF generation
  const isRenderForPdf = searchParams.get('pdf') === '1' || searchParams.get('print') === '1';

  // Use backend API instead of Cloud Functions
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // Legacy Cloud Functions base (fallback for downloads)
  const functionsBase = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'https://us-central1-payvost.cloudfunctions.net/api2';

  useEffect(() => {
    if (!id) return;

    const fetchInvoice = async () => {
      setLoading(true);
      try {
        // Try the legacy/public invoices collection first
        let docRef = doc(db, "invoices", id);
        let docSnap = await getDoc(docRef);
        console.log('[invoice] checked collection: invoices, exists:', docSnap.exists());

        // If not found in `invoices`, try the business invoices collection (created by business UI)
        if (!docSnap.exists()) {
          docRef = doc(db, "businessInvoices", id);
          docSnap = await getDoc(docRef);
          console.log('[invoice] checked collection: businessInvoices, exists:', docSnap.exists());
        }

        if (docSnap.exists() && docSnap.data().isPublic) {
          const invoiceData = docSnap.data();
          setInvoice(invoiceData);
          // record which collection returned the doc for debugging
          // docRef.path looks like 'invoices/<id>' or 'businessInvoices/<id>'
          setFoundInCollection(docRef.parent.id || (docRef.path.includes('businessInvoices') ? 'businessInvoices' : 'invoices'));

          // Fetch associated business profile (if there is a businessId)
          if (invoiceData.businessId) {
            const bizQuery = query(collection(db, 'users'), where('businessProfile.id', '==', invoiceData.businessId));
            const bizSnap = await getDocs(bizQuery);
            if (!bizSnap.empty) {
              setBusinessProfile(bizSnap.docs[0].data().businessProfile);
            }
          }

          // If online payment (stripe), fetch Stripe clientSecret
          if (invoiceData.paymentMethod === 'stripe') {
            const res = await fetch(`${apiBase}/create-payment-intent`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                invoiceId: id,
                amount: invoiceData.grandTotal * 100, // convert to cents
                currency: invoiceData.currency.toLowerCase()
              })
            });
            const data = await res.json();
            setClientSecret(data.clientSecret);
          }
        } else {
          setInvoice(null);
          console.log("Invoice not found or not public.");
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        // Surface a friendlier message in the UI so we can tell if it's a permission error
        const code = (error as any)?.code || (error as any)?.message || String(error);
        setFetchError(String(code));
        setInvoice(null);

        // If this is a rules/permission error, attempt server-side fallback endpoint
        if (String(code).toLowerCase().includes('permission-denied')) {
          try {
            const tryUrls = [
              `${apiBase}/api/public/invoice/${id}`,
            ];
            let fallbackData: any = null;
            for (const url of tryUrls) {
              try {
                const resp = await fetch(url);
                if (!resp.ok) continue;
                fallbackData = await resp.json();
                break;
              } catch (e) {
                // continue to next url
                continue;
              }
            }

            if (fallbackData) {
              // Normalize server timestamps (which may be plain objects) to objects with toDate()
              const normalizeDates = (data: any) => {
                const tsFields = ['issueDate', 'dueDate', 'paidAt', 'createdAt', 'updatedAt'];
                const out = { ...data };
                tsFields.forEach((f) => {
                  const v = out[f];
                  if (!v) return;
                  if (typeof v === 'string') {
                    out[f] = { toDate: () => new Date(v) };
                  } else if (typeof v === 'object') {
                    const secs = (v._seconds ?? v.seconds) as number | undefined;
                    if (typeof secs === 'number') {
                      out[f] = { toDate: () => new Date(secs * 1000) };
                    }
                  }
                });
                return out;
              };

              const normalized = normalizeDates(fallbackData);
              setInvoice(normalized as DocumentData);
              setFoundInCollection('server-endpoint');
              setFetchError(null);
            }
          } catch (err) {
            console.error('Server fallback failed:', err);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  // Download invoice PDF
  // Download invoice PDF
  const handleDownloadInvoice = () => {
    if (!id) return;

    // Prefer internal serverless route on Vercel
    const primaryUrl = `/api/pdf/invoice/${id}`;
    // Fallback to legacy Cloud Function if needed
    const fallbackUrl = `${functionsBase}/download/invoice/${id}`;

    toast({ title: 'Preparing Download', description: 'Generating your invoice PDF...' });

    const attempt = (url: string) => fetch(url).then(async (response) => {
      if (!response.ok) {
        const text = await response.text().catch(() => 'Unknown error');
        throw new Error(text);
      }
      return response.blob();
    });

    attempt(primaryUrl)
      .catch((err) => {
        console.warn('[Invoice Download] Primary failed, trying fallback:', err?.message || err);
        return attempt(fallbackUrl);
      })
      .then((blob) => {
        if (!blob) return;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast({ title: 'Download Complete', description: 'Your invoice has been downloaded.' });
      })
      .catch((error) => {
        console.error('[Invoice Download] Error:', error);
        const msg = String(error?.message || error);
        toast({
          title: 'Download Failed',
          description: msg.includes('not available yet') ? 'Service temporarily unavailable. Please try again later.' : msg,
          variant: 'destructive',
        });
      });
  };

  // Pay Now button handler
  const handlePayNow = () => {
    if (!invoice) return;

    if (invoice.paymentMethod === 'manual') {
      setIsManualPaymentDialogOpen(true);
    } else if (invoice.paymentMethod === 'stripe') {
      toast({
        title: "Payment Form Loaded",
        description: "Complete your payment below.",
      });
      // The StripeCheckout component is already rendered below, so we just guide the user.
    } else {
      toast({
        title: "Payment not available",
        description: "Unable to process online payment at this time.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center text-center p-4">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-16 w-16 text-destructive"/>
            <h1 className="text-3xl font-bold">Invoice Not Found</h1>
            <p className="text-muted-foreground">The requested invoice could not be found or is no longer available.</p>
            {fetchError && (
              <p className="text-sm text-destructive">Error: {fetchError}</p>
            )}
            {foundInCollection && (
              <p className="text-sm text-muted-foreground">Document exists in collection: {foundInCollection}</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  const currentStatus = invoice.status as Status;
  const currentStatusInfo = statusInfo[currentStatus];

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currencySymbols[currency] || currency;
    const formattedAmount = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    return `${symbol}${formattedAmount}`;
  };

  const subtotal = invoice.items.reduce((acc: number, item: any) => acc + (item.quantity || 0) * (item.price || 0), 0);
  const taxAmount = invoice.grandTotal - subtotal;

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 16mm;
        }
        @media print {
          html, body { background: #fff !important; }
          body { margin: 0; padding: 0; }
          header, .no-print, [role="dialog"], [role="alertdialog"], 
          .cookie-banner, .cookie-consent, [class*="cookie"], [class*="Cookie"],
          [class*="notification"], [class*="Notification"], [class*="toast"], [class*="Toast"],
          [id*="cookie"], [id*="notification"], [id*="onesignal"], [class*="onesignal"] { 
            display: none !important; 
          }
          .print-only { display: block !important; }
          .invoice-card { 
            box-shadow: none !important; 
            border: none !important;
            max-width: 100% !important;
            margin: 0 !important;
            background: #fff !important;
          }
        }
        @media screen {
          .print-only { display: none; }
        }
        ${isRenderForPdf ? `
          /* Apply print-like layout when ?pdf=1 or ?print=1 for PDF generation */
          header, .no-print, [role="dialog"], [role="alertdialog"],
          .cookie-banner, .cookie-consent, [class*="cookie"], [class*="Cookie"],
          [class*="notification"], [class*="Notification"], [class*="toast"], [class*="Toast"],
          [id*="cookie"], [id*="notification"], [id*="onesignal"], [class*="onesignal"] { 
            display: none !important; 
          }
          .invoice-card {
            box-shadow: none !important;
            border: none !important;
            max-width: 800px !important;
            margin: 0 auto !important;
            background: #fff !important;
          }
          html, body { background: #fff !important; }
          .print-only { display: block !important; }
        ` : ''}
      `}</style>
      
      <div className="flex flex-col min-h-screen bg-muted/10">
        <SiteHeader />
        <main className="flex-1 py-12 px-4">
          <div className="max-w-4xl mx-auto mb-4 flex justify-end gap-2 no-print">
            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4"/>Print</Button>
            <Button variant="outline" onClick={handleDownloadInvoice}><Download className="mr-2 h-4 w-4"/>Download PDF</Button>
            <Button variant="outline"><Share2 className="mr-2 h-4 w-4"/>Share</Button>
          </div>

          <Card className="max-w-4xl mx-auto w-full invoice-card">
          <CardHeader className="flex flex-col md:flex-row justify-between gap-4 bg-muted/50 p-6">
            <div className="flex-1 flex items-center gap-4">
        {typeof businessProfile?.invoiceLogoUrl === 'string' && businessProfile.invoiceLogoUrl.length > 0 && (
          <Image src={businessProfile.invoiceLogoUrl} alt="Business Logo" width={80} height={80} className="rounded-md object-contain" />
        )}
                 <div>
                    <h2 className="text-2xl font-bold text-primary">INVOICE</h2>
                    <p className="text-muted-foreground"># {invoice.invoiceNumber}</p>
                 </div>
            </div>
            <div className="text-right">
              <Badge variant={currentStatusInfo.variant} className="capitalize flex items-center gap-1.5 text-lg">
                {currentStatusInfo.icon} {invoice.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <h3 className="font-semibold">Billed To</h3>
                <p className="text-sm">{invoice.toName}</p>
                <p className="text-sm text-muted-foreground">{invoice.toAddress}</p>
                <p className="text-sm text-muted-foreground">{invoice.toEmail}</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">From</h3>
                <p className="text-sm">{invoice.fromName}</p>
                <p className="text-sm text-muted-foreground">{invoice.fromAddress}</p>
              </div>
              <div className="space-y-1 text-left md:text-right col-span-2 md:col-span-1">
                <p><strong className="font-semibold">Issue Date:</strong> {format(invoice.issueDate.toDate(), 'PPP')}</p>
                <p><strong className="font-semibold">Due Date:</strong> {format(invoice.dueDate.toDate(), 'PPP')}</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Description</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price, invoice.currency)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.quantity * item.price, invoice.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal, invoice.currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span><span>{formatCurrency(taxAmount, invoice.currency)}</span></div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg"><span>Grand Total</span><span>{formatCurrency(invoice.grandTotal, invoice.currency)}</span></div>
              </div>
            </div>

            {invoice.notes && (
              <div>
                <h4 className="font-semibold">Notes</h4>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}

            {/* ---------------- Stripe Payment Form ---------------- */}
            {invoice.paymentMethod === 'stripe' && clientSecret && invoice.status !== 'Paid' && (
              <div className="mt-8">
                <StripeCheckout clientSecret={clientSecret} />
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-muted/50 p-6 flex-col md:flex-row gap-4 justify-between">
            <p className="text-sm text-muted-foreground">Pay with Payvost for a secure and seamless experience.</p>
            {(invoice.paymentMethod === 'manual' || invoice.paymentMethod === 'stripe') && invoice.status !== 'Paid' && (
              <Button size="lg" onClick={handlePayNow}>
                Pay {formatCurrency(invoice.grandTotal, invoice.currency)} Now
              </Button>
            )}
            {invoice.status === 'Paid' && <Button size="lg" disabled>Paid</Button>}
          </CardFooter>
        </Card>

         <div className="text-center mt-8 text-sm text-muted-foreground no-print">
            Powered by{' '}
            <Link href="/" className="font-semibold text-primary hover:underline flex items-center justify-center gap-1">
                <Icons.logo className="h-6" />
            </Link>
            <Link href="/register" className="underline hover:text-primary">Create your own invoices for free</Link>.
        </div>

        {/* ---------------- Manual Payment Dialog ---------------- */}
        <Dialog open={isManualPaymentDialogOpen} onOpenChange={setIsManualPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual Bank Transfer</DialogTitle>
              <DialogDescription>
                To complete payment, please make a bank transfer to the following account details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Bank Name:</span><span className="font-semibold">{invoice.manualBankName}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Account Name:</span><span className="font-semibold">{invoice.manualAccountName}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Account Number:</span><span className="font-semibold">{invoice.manualAccountNumber}</span></div>
              {invoice.manualOtherDetails && <div className="flex justify-between items-center"><span className="text-muted-foreground">Other Details:</span><span className="font-semibold">{invoice.manualOtherDetails}</span></div>}
              <Separator className="my-4"/>
              <p className="text-xs text-center text-muted-foreground">Once payment is made, the sender will be notified to confirm receipt.</p>
            </div>
            <DialogFooter>
              <Button onClick={() => navigator.clipboard.writeText(`Bank: ${invoice.manualBankName}\nAccount Name: ${invoice.manualAccountName}\nAccount Number: ${invoice.manualAccountNumber}`)} variant="secondary">
                <Copy className="mr-2 h-4 w-4"/>Copy Details
              </Button>
              <Button onClick={() => setIsManualPaymentDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
    </>
  );
}
