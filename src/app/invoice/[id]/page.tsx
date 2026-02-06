'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { DocumentData } from 'firebase/firestore';
import StripeCheckout from '@/components/StripeCheckout';
import { InvoicePaymentOptions } from '@/components/InvoicePaymentOptions';
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
import Image from 'next/image';
import { numberToWords } from '@/lib/utils/number-to-words';

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

function PublicInvoicePageContent() {
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

  // Check if this page is being rendered for print/PDF generation
  const [forcePrintLayout, setForcePrintLayout] = useState(false);
  const isRenderForPdf = forcePrintLayout || searchParams.get('pdf') === '1' || searchParams.get('print') === '1' || searchParams.get('download') === '1';
  const shouldAutoPrint = searchParams.get('print') === '1' || searchParams.get('download') === '1';

  // Use backend API instead of Cloud Functions
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (!id) return;

    const fetchInvoice = async () => {
      setLoading(true);
      try {
        // Try backend API endpoint first
        let response: Response;
        let invoiceData: any;
        let useFallback = false;

        try {
          response = await fetch(`/api/invoices/public/${id}`, {
            method: 'GET',
            cache: 'no-store',
          });

          if (!response.ok) {
            // If it's a 503 (service unavailable) or 500, try fallback
            if (response.status === 503 || response.status === 500) {
              console.warn('Backend API unavailable, trying fallback...');
              useFallback = true;
            } else if (response.status === 404) {
              setFetchError("Invoice not found");
              setInvoice(null);
              return;
            } else {
              let errorMessage = `Failed to fetch invoice: ${response.statusText}`;
              try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
              } catch (e) {
                // If response is not JSON, use status text
              }
              setFetchError(errorMessage);
              setInvoice(null);
              return;
            }
          } else {
            invoiceData = await response.json();
          }
        } catch (apiError) {
          console.warn('Backend API error, trying fallback:', apiError);
          useFallback = true;
        }

        // Fallback: Use direct Firestore reads if backend fails
        if (useFallback) {
          try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            
            // Try businessInvoices collection first
            let docRef = doc(db, 'businessInvoices', id);
            let docSnap = await getDoc(docRef);

            // If not found, try regular invoices collection
            if (!docSnap.exists()) {
              docRef = doc(db, 'invoices', id);
              docSnap = await getDoc(docRef);
            }

            if (!docSnap.exists()) {
              setFetchError("Invoice not found");
              setInvoice(null);
              return;
            }

            const data = docSnap.data();
            const isDraft = data?.status === 'Draft';
            if (isDraft) {
              setFetchError("Invoice is not public");
              setInvoice(null);
              return;
            }

            // Convert to expected format
            invoiceData = {
              id: docSnap.id,
              ...data,
              // Ensure dates are properly formatted (convert to ISO strings for consistency)
              issueDate: data?.issueDate?.toDate ? data.issueDate.toDate().toISOString() : 
                        (data?.issueDate instanceof Date ? data.issueDate.toISOString() : data?.issueDate),
              dueDate: data?.dueDate?.toDate ? data.dueDate.toDate().toISOString() : 
                      (data?.dueDate instanceof Date ? data.dueDate.toISOString() : data?.dueDate),
              createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : 
                        (data?.createdAt instanceof Date ? data.createdAt.toISOString() : data?.createdAt),
              updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : 
                        (data?.updatedAt instanceof Date ? data.updatedAt.toISOString() : data?.updatedAt),
            };

            // Try to fetch business profile if businessId exists (for fallback)
            if (invoiceData.businessId) {
              try {
                const { query, collection, where, getDocs } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');
                const bizQuery = query(collection(db, 'users'), where('businessProfile.id', '==', invoiceData.businessId));
                const bizSnap = await getDocs(bizQuery);
                if (!bizSnap.empty) {
                  setBusinessProfile(bizSnap.docs[0].data().businessProfile);
                }
              } catch (profileError) {
                console.warn('Could not fetch business profile in fallback:', profileError);
                // Continue without business profile
              }
            }
          } catch (fallbackError: any) {
            console.error('Fallback also failed:', fallbackError);
            setFetchError(fallbackError?.code === 'permission-denied' 
              ? "Permission denied. Please ensure the invoice is public."
              : "Failed to load invoice. Please try again later.");
            setInvoice(null);
            return;
          }
        }

        if (!invoiceData || !invoiceData.id) {
          setFetchError("Invalid invoice data received");
          setInvoice(null);
          return;
        }
        
        // Convert backend format to frontend format
        // Handle both Prisma format and Firestore format
        const convertedInvoice = {
          ...invoiceData,
          // Convert Decimal to number for grandTotal and taxRate
          grandTotal: typeof invoiceData.grandTotal === 'object' 
            ? parseFloat(invoiceData.grandTotal.toString()) 
            : invoiceData.grandTotal,
          taxRate: typeof invoiceData.taxRate === 'object'
            ? parseFloat(invoiceData.taxRate.toString())
            : invoiceData.taxRate || 0,
          // Convert dates if they're strings
          issueDate: invoiceData.issueDate instanceof Date 
            ? invoiceData.issueDate 
            : new Date(invoiceData.issueDate),
          dueDate: invoiceData.dueDate instanceof Date
            ? invoiceData.dueDate
            : new Date(invoiceData.dueDate),
          // Ensure items array exists
          items: invoiceData.items || [],
          // Convert fromInfo/toInfo if they're objects
          fromName: invoiceData.fromInfo?.name || invoiceData.fromName || '',
          fromAddress: invoiceData.fromInfo?.address || invoiceData.fromAddress || '',
          toName: invoiceData.toInfo?.name || invoiceData.toName || '',
          toAddress: invoiceData.toInfo?.address || invoiceData.toAddress || '',
          toEmail: invoiceData.toInfo?.email || invoiceData.toEmail || '',
          // Handle payment method
          paymentMethod: invoiceData.paymentMethod?.toLowerCase() || 'payvost',
          // Handle manual bank details
          manualBankName: invoiceData.manualBankDetails?.bankName || invoiceData.manualBankName || '',
          manualAccountName: invoiceData.manualBankDetails?.accountName || invoiceData.manualAccountName || '',
          manualAccountNumber: invoiceData.manualBankDetails?.accountNumber || invoiceData.manualAccountNumber || '',
          manualOtherDetails: invoiceData.manualBankDetails?.otherDetails || invoiceData.manualOtherDetails || '',
        };

        // Set business profile if available (backend includes it)
        if (invoiceData.businessProfile) {
          setBusinessProfile(invoiceData.businessProfile);
        }

        setInvoice(convertedInvoice);
        setFoundInCollection(invoiceData.businessId ? 'businessInvoices' : 'invoices');

        // If online payment (stripe), fetch Stripe clientSecret
        if (convertedInvoice.paymentMethod === 'stripe') {
          try {
            const res = await fetch(`${apiBase}/create-payment-intent`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                invoiceId: id,
                amount: convertedInvoice.grandTotal * 100, // convert to cents
                currency: convertedInvoice.currency.toLowerCase()
              })
            });
            const data = await res.json();
            setClientSecret(data.clientSecret);
          } catch (paymentError) {
            console.warn('Could not fetch payment intent:', paymentError);
            // Continue without payment intent
          }
        }
      } catch (error: any) {
        console.error("Error fetching invoice:", error);
        setFetchError(error?.message || String(error));
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  // Download invoice PDF (uses print layout for consistent styling)
  const handleDownloadInvoice = () => {
    if (!id) return;
    setForcePrintLayout(true);
    setTimeout(() => window.print(), 200);
    toast({
      title: "Preparing Download",
      description: "A print-optimized view will open. Choose “Save as PDF” in the print dialog.",
    });
  };

  // Print invoice using the on-page print layout
  const handlePrint = () => {
    if (!id) return;
    setForcePrintLayout(true);
    setTimeout(() => window.print(), 200);
    toast({
      title: "Opening Print View",
      description: "Opening the print dialog.",
    });
  };

  useEffect(() => {
    if (!shouldAutoPrint) return;
    const timer = setTimeout(() => {
      window.print();
    }, 300);
    return () => clearTimeout(timer);
  }, [shouldAutoPrint]);

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
    } else if (invoice.paymentMethod === 'rapyd') {
      // Scroll to payment options (they're already rendered below)
      const paymentSection = document.getElementById('payment-options');
      if (paymentSection) {
        paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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

  // Normalize status from backend (might be uppercase like 'PENDING') to title case
  const normalizeStatus = (status: string | undefined): Status => {
    if (!status) return 'Pending';
    const statusLower = String(status).toLowerCase();
    if (statusLower === 'paid') return 'Paid';
    if (statusLower === 'pending') return 'Pending';
    if (statusLower === 'overdue') return 'Overdue';
    if (statusLower === 'draft') return 'Draft';
    return 'Pending'; // Default fallback
  };

  const currentStatus = normalizeStatus(invoice.status);
  const currentStatusInfo = statusInfo[currentStatus] || statusInfo['Pending']; // Fallback to Pending if status not found

  const formatCurrency = (amount: number | string | undefined | null, currency: string | undefined | null) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
    if (isNaN(numAmount)) return '$0.00';
    
    const safeCurrency = currency && typeof currency === 'string' ? currency.toUpperCase() : 'USD';
    const symbol = currencySymbols[safeCurrency] || safeCurrency;
    const formattedAmount = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numAmount);
    return `${symbol}${formattedAmount}`;
  };

  const subtotal = (invoice.items || []).reduce((acc: number, item: any) => acc + ((item.quantity || 0) * (item.price || 0)), 0);
  const taxAmount = (invoice.grandTotal || 0) - subtotal;
  
  // Safely convert amount and currency for numberToWords
  const safeGrandTotal = typeof invoice.grandTotal === 'number' ? invoice.grandTotal : parseFloat(String(invoice.grandTotal || 0));
  const safeCurrency = invoice.currency && typeof invoice.currency === 'string' ? invoice.currency : 'USD';
  const amountInWords = numberToWords(safeGrandTotal, safeCurrency);

  return (
    <>
      <style jsx global>{`
        @media print {
          html, body { background: #fff !important; }
          body { margin: 0; padding: 0; }
          header, .no-print, [role="dialog"], [role="alertdialog"], 
          .cookie-banner, .cookie-consent, [class*="cookie"], [class*="Cookie"],
          [class*="notification"], [class*="Notification"], [class*="toast"], [class*="Toast"],
          [id*="cookie"], [id*="notification"], [id*="onesignal"], [class*="onesignal"] { 
            display: none !important; 
          }
          .invoice-card { 
            box-shadow: none !important; 
            border: none !important;
            max-width: 100% !important;
            margin: 0 !important;
            background: #fff !important;
          }
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
        ` : ''}
      `}</style>
    <div className="flex flex-col min-h-screen bg-muted/10">
      <SiteHeader />
      <main className="flex-1 py-6 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto mb-4 sm:mb-6 flex flex-wrap justify-end gap-2 no-print">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={handlePrint}>
            <Printer className="mr-2 h-3 w-3 sm:h-4 sm:w-4"/>Print
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={handleDownloadInvoice}>
            <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4"/>Download PDF
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <Share2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4"/>Share
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto w-full invoice-card shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 bg-muted/50 p-4 sm:p-6">
            <div className="flex-1 flex items-center gap-3 sm:gap-4">
                {businessProfile?.invoiceLogoUrl && (
                    <Image src={businessProfile.invoiceLogoUrl} alt="Business Logo" width={60} height={60} className="sm:w-20 sm:h-20 rounded-md object-contain" />
                )}
                 <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-primary">INVOICE</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground"># {invoice.invoiceNumber || invoice.id || 'N/A'}</p>
                 </div>
            </div>
            <div className="text-left sm:text-right">
              <Badge variant={currentStatusInfo?.variant || 'secondary'} className="capitalize flex items-center gap-1.5 text-sm sm:text-lg w-fit sm:w-auto">
                {currentStatusInfo?.icon} {currentStatus}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="space-y-1">
                <h3 className="font-semibold text-sm sm:text-base">Billed To</h3>
                <p className="text-xs sm:text-sm">{invoice.toName || 'N/A'}</p>
                {invoice.toAddress && <p className="text-xs sm:text-sm text-muted-foreground break-words">{invoice.toAddress}</p>}
                {invoice.toEmail && <p className="text-xs sm:text-sm text-muted-foreground break-all">{invoice.toEmail}</p>}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm sm:text-base">From</h3>
                <p className="text-xs sm:text-sm">{invoice.fromName || 'N/A'}</p>
                {invoice.fromAddress && <p className="text-xs sm:text-sm text-muted-foreground break-words">{invoice.fromAddress}</p>}
              </div>
              <div className="space-y-1 text-left sm:text-left md:text-right col-span-1 sm:col-span-2 md:col-span-1">
                <p className="text-xs sm:text-sm"><strong className="font-semibold">Issue Date:</strong> {
                  invoice.issueDate ? (() => {
                    try {
                      const date = invoice.issueDate?.toDate ? invoice.issueDate.toDate() : new Date(invoice.issueDate);
                      return isNaN(date.getTime()) ? 'N/A' : format(date, 'PPP');
                    } catch {
                      return 'N/A';
                    }
                  })() : 'N/A'
                }</p>
                <p className="text-xs sm:text-sm"><strong className="font-semibold">Due Date:</strong> {
                  invoice.dueDate ? (() => {
                    try {
                      const date = invoice.dueDate?.toDate ? invoice.dueDate.toDate() : new Date(invoice.dueDate);
                      return isNaN(date.getTime()) ? 'N/A' : format(date, 'PPP');
                    } catch {
                      return 'N/A';
                    }
                  })() : 'N/A'
                }</p>
              </div>
            </div>

            {/* Table with borders */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-b border-border">
                      <TableHead className="w-[50%] sm:w-[60%] font-semibold text-xs sm:text-sm">Description</TableHead>
                      <TableHead className="text-center font-semibold text-xs sm:text-sm">Qty</TableHead>
                      <TableHead className="text-right font-semibold text-xs sm:text-sm">Price</TableHead>
                      <TableHead className="text-right font-semibold text-xs sm:text-sm">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(invoice.items || []).map((item: any, index: number) => (
                      <TableRow key={index} className="border-b border-border last:border-b-0">
                        <TableCell className="font-medium text-xs sm:text-sm py-3 sm:py-4">{item?.description || 'N/A'}</TableCell>
                        <TableCell className="text-center text-xs sm:text-sm py-3 sm:py-4">{item?.quantity || 0}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm py-3 sm:py-4">{formatCurrency(item?.price, invoice.currency)}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm font-semibold py-3 sm:py-4">{formatCurrency((item?.quantity || 0) * (item?.price || 0), invoice.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-full sm:w-auto sm:min-w-[280px] max-w-sm space-y-2 border border-border rounded-lg p-4 sm:p-6 bg-muted/30">
                <div className="flex justify-between text-sm sm:text-base"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatCurrency(subtotal, invoice.currency)}</span></div>
                <div className="flex justify-between text-sm sm:text-base"><span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span><span className="font-medium">{formatCurrency(taxAmount, invoice.currency)}</span></div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-base sm:text-lg"><span>Grand Total</span><span>{formatCurrency(invoice.grandTotal, invoice.currency)}</span></div>
              </div>
            </div>

            {/* Amount in Words */}
            {foundInCollection === 'invoices' && (
              <div className="bg-muted/50 p-3 sm:p-4 rounded-lg border-l-4 border-primary">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Amount in Words</p>
                <p className="text-xs sm:text-sm font-medium italic break-words">{amountInWords}</p>
              </div>
            )}

            {invoice.notes && (
              <div>
                <h4 className="font-semibold text-sm sm:text-base mb-2">Notes</h4>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">{invoice.notes}</p>
              </div>
            )}

            {/* ---------------- Stripe Payment Form ---------------- */}
            {invoice.paymentMethod === 'stripe' && clientSecret && currentStatus !== 'Paid' && !isRenderForPdf && (
              <div className="mt-6 sm:mt-8 border-t border-border pt-6 sm:pt-8">
                <StripeCheckout clientSecret={clientSecret} />
              </div>
            )}

            {/* ---------------- Payment Options ---------------- */}
            {invoice.paymentMethod === 'rapyd' && currentStatus !== 'Paid' && !isRenderForPdf && (
              <div id="payment-options" className="mt-6 sm:mt-8 border-t border-border pt-6 sm:pt-8">
                <InvoicePaymentOptions
                  invoiceId={id}
                  amount={invoice.grandTotal}
                  currency={invoice.currency}
                  customerEmail={invoice.toEmail}
                  customerName={invoice.toName}
                  onPaymentSuccess={() => {
                    // Refresh invoice status
                    window.location.reload();
                  }}
                />
              </div>
            )}
          </CardContent>

          {!isRenderForPdf && (
            <CardFooter className="bg-muted/50 p-4 sm:p-6 flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">Pay with Payvost for a secure and seamless experience.</p>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {(invoice.paymentMethod === 'manual' || invoice.paymentMethod === 'stripe' || invoice.paymentMethod === 'rapyd') && currentStatus !== 'Paid' && (
                  <Button 
                    size="lg" 
                    onClick={handlePayNow}
                    className="w-full sm:w-auto text-sm sm:text-base font-semibold"
                  >
                    Pay {formatCurrency(invoice.grandTotal, invoice.currency)} Now
                  </Button>
                )}
                {currentStatus === 'Paid' && (
                  <Button size="lg" disabled className="w-full sm:w-auto">
                    Paid
                  </Button>
                )}
              </div>
            </CardFooter>
          )}
        </Card>

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

export default function PublicInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading invoice...</div>
        </div>
      }
    >
      <PublicInvoicePageContent />
    </Suspense>
  );
}
