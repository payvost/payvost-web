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

  useEffect(() => {
    if (!id) return;

    const fetchInvoice = async () => {
      setLoading(true);
      try {
        let isBusinessInvoice = false;
        // Try the invoices collection first
        let docRef = doc(db, "invoices", id);
        let docSnap = await getDoc(docRef);
        console.log('[invoice] checked collection: invoices, exists:', docSnap.exists());

        // If not found in `invoices`, try the business invoices collection
        if (!docSnap.exists()) {
          docRef = doc(db, "businessInvoices", id);
          docSnap = await getDoc(docRef);
          isBusinessInvoice = true;
          console.log('[invoice] checked collection: businessInvoices, exists:', docSnap.exists());
        }

        if (docSnap.exists()) {
          const invoiceData = docSnap.data();
          
          // For regular invoices, check isPublic. 
          // For business invoices, rules allow read: if true, but we should still respect Draft status
          const isPublic = invoiceData.isPublic !== false; // Default to true if not set
          const isDraft = invoiceData.status === 'Draft';
          // Business invoices are publicly readable per rules, but don't show drafts publicly
          // Regular invoices must have isPublic === true
          const canView = isBusinessInvoice 
            ? !isDraft  // Business invoices: show if not draft
            : isPublic; // Regular invoices: show if public
          
          if (canView) {
            setInvoice(invoiceData);
            setFoundInCollection(isBusinessInvoice ? 'businessInvoices' : 'invoices');

            // Fetch associated business profile (if there is a businessId)
            if (invoiceData.businessId) {
              try {
                const bizQuery = query(collection(db, 'users'), where('businessProfile.id', '==', invoiceData.businessId));
                const bizSnap = await getDocs(bizQuery);
                if (!bizSnap.empty) {
                  setBusinessProfile(bizSnap.docs[0].data().businessProfile);
                }
              } catch (profileError) {
                console.warn('Could not fetch business profile:', profileError);
                // Continue without business profile
              }
            }

            // If online payment (stripe), fetch Stripe clientSecret
            if (invoiceData.paymentMethod === 'stripe') {
              try {
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
              } catch (paymentError) {
                console.warn('Could not fetch payment intent:', paymentError);
                // Continue without payment intent
              }
            }
          } else {
            setInvoice(null);
            console.log("Invoice is not public.");
            setFetchError("Invoice is not public");
          }
        } else {
          setInvoice(null);
          console.log("Invoice not found.");
          setFetchError("Invoice not found");
        }
      } catch (error: any) {
        console.error("Error fetching invoice:", error);
        const code = (error as any)?.code || (error as any)?.message || String(error);
        setFetchError(String(code));
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  // Download invoice PDF
  const handleDownloadInvoice = () => {
    if (!id) return;

    // Use Vercel serverless function for PDF generation
    const downloadUrl = `/api/pdf/invoice/${id}`;
    
    // Show loading toast
    toast({
      title: "Preparing Download",
      description: "Generating your invoice PDF...",
    });

    // Attempt download with error handling
    fetch(downloadUrl)
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          
          // Check if it's the billing/service unavailable error
          if (errorText.includes('not available yet') || errorText.includes('try again in 30 seconds')) {
            toast({
              title: "Service Temporarily Unavailable",
              description: "The PDF generation service is currently unavailable. Please try again later or contact support.",
              variant: "destructive",
            });
          } else if (errorText.includes('not configured')) {
            toast({
              title: "Configuration Error",
              description: "The PDF service is not properly configured. Please contact support.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Download Failed",
              description: `Unable to generate PDF. ${errorText}`,
              variant: "destructive",
            });
          }
          throw new Error(errorText);
        }
        return response.blob();
      })
      .then((blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download Complete",
          description: "Your invoice has been downloaded successfully.",
        });
      })
      .catch((error) => {
        console.error('[Invoice Download] Error:', error);
        // Error toast already shown above
      });
  };

  // Print invoice PDF
  const handlePrint = () => {
    if (!id) return;
    
    // Open PDF in new window for printing
    const pdfUrl = `/api/pdf/invoice/${id}`;
    window.open(pdfUrl, '_blank');
    
    toast({
      title: "Opening PDF",
      description: "The invoice PDF will open in a new window. Use the print button in the PDF viewer.",
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
  const itemCount = invoice.items?.length || 0;
  const isCompactMode = itemCount <= 3 && foundInCollection === 'invoices'; // Only for personal invoices with 3 or fewer items
  const amountInWords = numberToWords(invoice.grandTotal, invoice.currency);

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: ${isCompactMode ? '12mm' : '16mm'};
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
            padding: ${isCompactMode ? '20px' : '24px'} !important;
          }
          .compact-invoice {
            font-size: 13px !important;
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
            padding: ${isCompactMode ? '20px' : '24px'} !important;
          }
          html, body { background: #fff !important; }
          .print-only { display: block !important; }
        ` : ''}
        .compact-invoice {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .compact-invoice .invoice-header {
          border-bottom: 3px solid #0066FF;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .compact-invoice .invoice-title {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #1D1D1F;
          margin: 0;
        }
        .compact-invoice .invoice-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }
        .compact-invoice .status-badge-compact {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .compact-invoice .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 20px;
        }
        .compact-invoice .info-block h4 {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6E6E73;
          margin: 0 0 8px 0;
        }
        .compact-invoice .info-block p {
          font-size: 13px;
          color: #1D1D1F;
          margin: 3px 0;
          line-height: 1.4;
        }
        .compact-invoice .items-table-compact {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        .compact-invoice .items-table-compact thead {
          border-bottom: 2px solid #E5E5E5;
        }
        .compact-invoice .items-table-compact th {
          text-align: left;
          padding: 10px 0;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6E6E73;
        }
        .compact-invoice .items-table-compact td {
          padding: 12px 0;
          font-size: 13px;
          color: #1D1D1F;
          border-bottom: 1px solid #F5F5F7;
        }
        .compact-invoice .items-table-compact th.text-right,
        .compact-invoice .items-table-compact td.text-right {
          text-align: right;
        }
        .compact-invoice .items-table-compact th.text-center,
        .compact-invoice .items-table-compact td.text-center {
          text-align: center;
        }
        .compact-invoice .totals-compact {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 16px;
        }
        .compact-invoice .totals-box-compact {
          width: 280px;
        }
        .compact-invoice .total-row-compact {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
        }
        .compact-invoice .total-row-compact.grand {
          padding-top: 12px;
          margin-top: 8px;
          border-top: 2px solid #0066FF;
          font-size: 18px;
          font-weight: 700;
          color: #1D1D1F;
        }
        .compact-invoice .amount-words {
          background: #F5F5F7;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
          border-left: 3px solid #0066FF;
        }
        .compact-invoice .amount-words-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6E6E73;
          margin-bottom: 4px;
        }
        .compact-invoice .amount-words-value {
          font-size: 13px;
          color: #1D1D1F;
          font-weight: 500;
          font-style: italic;
        }
        .compact-invoice .notes-compact {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #E5E5E5;
        }
        .compact-invoice .notes-compact h5 {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6E6E73;
          margin: 0 0 6px 0;
        }
        .compact-invoice .notes-compact p {
          font-size: 12px;
          color: #6E6E73;
          line-height: 1.5;
          margin: 0;
        }
      `}</style>
      
      <div className="flex flex-col min-h-screen bg-muted/10">
        <SiteHeader />
        <main className="flex-1 py-12 px-4">
          <div className="max-w-4xl mx-auto mb-4 flex justify-end gap-2 no-print">
            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print</Button>
            <Button variant="outline" onClick={handleDownloadInvoice}><Download className="mr-2 h-4 w-4"/>Download PDF</Button>
            <Button variant="outline"><Share2 className="mr-2 h-4 w-4"/>Share</Button>
          </div>

          {isCompactMode ? (
            <Card className={`max-w-3xl mx-auto w-full invoice-card compact-invoice`}>
              <CardContent className="p-5">
                {/* Compact Header */}
                <div className="invoice-header">
                  <div className="invoice-meta-row">
                    <div>
                      <h1 className="invoice-title">INVOICE</h1>
                      <p style={{ fontSize: '12px', color: '#6E6E73', marginTop: '4px' }}>#{invoice.invoiceNumber}</p>
                    </div>
                    <Badge 
                      variant={currentStatusInfo.variant} 
                      className={`status-badge-compact capitalize`}
                      style={{
                        backgroundColor: currentStatus === 'Paid' ? '#D1FAE5' : currentStatus === 'Pending' ? '#FEF3C7' : currentStatus === 'Overdue' ? '#FEE2E2' : '#F3F4F6',
                        color: currentStatus === 'Paid' ? '#10B981' : currentStatus === 'Pending' ? '#F59E0B' : currentStatus === 'Overdue' ? '#EF4444' : '#6B7280',
                        border: 'none'
                      }}
                    >
                      {currentStatusInfo.icon} {invoice.status}
                    </Badge>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="info-grid">
                  <div className="info-block">
                    <h4>Billed To</h4>
                    <p style={{ fontWeight: 600 }}>{invoice.toName}</p>
                    {invoice.toAddress && <p>{invoice.toAddress}</p>}
                    {invoice.toEmail && <p>{invoice.toEmail}</p>}
                  </div>
                  <div className="info-block">
                    <h4>From</h4>
                    <p style={{ fontWeight: 600 }}>{invoice.fromName}</p>
                    {invoice.fromAddress && <p>{invoice.fromAddress}</p>}
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#6E6E73' }}>
                      <p><strong>Issue Date:</strong> {format(invoice.issueDate?.toDate ? invoice.issueDate.toDate() : new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
                      <p><strong>Due Date:</strong> {format(invoice.dueDate?.toDate ? invoice.dueDate.toDate() : new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="items-table-compact">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Unit Price</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td style={{ fontWeight: 500 }}>{item.description}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">{formatCurrency(item.price, invoice.currency)}</td>
                        <td className="text-right" style={{ fontWeight: 600 }}>{formatCurrency(item.quantity * item.price, invoice.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="totals-compact">
                  <div className="totals-box-compact">
                    <div className="total-row-compact">
                      <span style={{ color: '#6E6E73' }}>Subtotal</span>
                      <span>{formatCurrency(subtotal, invoice.currency)}</span>
                    </div>
                    {taxAmount > 0 && (
                      <div className="total-row-compact">
                        <span style={{ color: '#6E6E73' }}>Tax ({invoice.taxRate}%)</span>
                        <span>{formatCurrency(taxAmount, invoice.currency)}</span>
                      </div>
                    )}
                    <div className="total-row-compact grand">
                      <span>Grand Total</span>
                      <span>{formatCurrency(invoice.grandTotal, invoice.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="amount-words">
                  <div className="amount-words-label">Amount in Words</div>
                  <div className="amount-words-value">{amountInWords}</div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="notes-compact">
                    <h5>Notes</h5>
                    <p>{invoice.notes}</p>
                  </div>
                )}

                {/* Payment Section */}
                {invoice.paymentMethod === 'stripe' && clientSecret && invoice.status !== 'Paid' && !isRenderForPdf && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E5E5' }}>
                    <StripeCheckout clientSecret={clientSecret} />
                  </div>
                )}
              </CardContent>

              {!isRenderForPdf && (
                <CardFooter className="bg-muted/30 p-4 flex-col md:flex-row gap-3 justify-between">
                  <p className="text-xs text-muted-foreground">Pay with Payvost for a secure and seamless experience.</p>
                  {(invoice.paymentMethod === 'manual' || invoice.paymentMethod === 'stripe') && invoice.status !== 'Paid' && (
                    <Button size="sm" onClick={handlePayNow}>
                      Pay {formatCurrency(invoice.grandTotal, invoice.currency)} Now
                    </Button>
                  )}
                  {invoice.status === 'Paid' && <Button size="sm" disabled>Paid</Button>}
                </CardFooter>
              )}
            </Card>
          ) : (
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
                    <p><strong className="font-semibold">Issue Date:</strong> {format(invoice.issueDate?.toDate ? invoice.issueDate.toDate() : new Date(invoice.issueDate), 'PPP')}</p>
                    <p><strong className="font-semibold">Due Date:</strong> {format(invoice.dueDate?.toDate ? invoice.dueDate.toDate() : new Date(invoice.dueDate), 'PPP')}</p>
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

                {/* Amount in Words for non-compact mode too */}
                {foundInCollection === 'invoices' && (
                  <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Amount in Words</p>
                    <p className="text-sm font-medium italic">{amountInWords}</p>
                  </div>
                )}

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
          )}

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
