
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, AlertTriangle, Loader2, FileText, Landmark, Wallet, Printer, Download, Share2, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';


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
    const id = params.id as string;
    const [invoice, setInvoice] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [isManualPaymentDialogOpen, setIsManualPaymentDialogOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        
        const fetchInvoice = async () => {
            setLoading(true);
             try {
                const docRef = doc(db, "invoices", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().isPublic) {
                    setInvoice(docSnap.data());
                } else {
                    setInvoice(null);
                    console.log("Invoice not found or not public.");
                }
            } catch (error) {
                console.error("Error fetching invoice:", error);
                setInvoice(null);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();

    }, [id]);

    const handlePayNow = () => {
        if (invoice?.paymentMethod === 'manual') {
            setIsManualPaymentDialogOpen(true);
        } else {
            toast({
                title: "Redirecting to Payment...",
                description: "You will be redirected to a secure payment page.",
            });
            // In a real app, you would redirect to your payment processor here.
            // For example: router.push(`/checkout?invoiceId=${id}`);
        }
    };

    const handleCopyDetails = () => {
        if (!invoice) return;
        const details = `Bank Name: ${invoice.manualBankName}\nAccount Name: ${invoice.manualAccountName}\nAccount Number: ${invoice.manualAccountNumber}\n${invoice.manualOtherDetails || ''}`;
        navigator.clipboard.writeText(details.trim());
        toast({
            title: "Copied to Clipboard!",
            description: "Bank transfer details have been copied.",
        });
    };
    
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <SiteHeader />
                <main className="flex-1 flex items-center justify-center p-4">
                     <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </main>
            </div>
        )
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
                    </div>
                </main>
            </div>
        )
    }

    const currentStatus = invoice.status as Status;
    const currentStatusInfo = statusInfo[currentStatus];

    const formatCurrency = (amount: number, currency: string) => {
        const symbol = currencySymbols[currency] || currency;
        // Use Intl.NumberFormat for robust formatting with commas
        const formattedAmount = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
        return `${symbol}${formattedAmount}`;
    };

    const subtotal = invoice.items.reduce((acc: number, item: any) => acc + (item.quantity || 0) * (item.price || 0), 0);
    const taxAmount = invoice.grandTotal - subtotal;

    return (
        <div className="flex flex-col min-h-screen bg-muted/10">
            <SiteHeader />
             <main className="flex-1 py-12 px-4">
                <div className="max-w-4xl mx-auto mb-4 flex justify-end gap-2">
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4"/>Print</Button>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4"/>Download PDF</Button>
                    <Button variant="outline"><Share2 className="mr-2 h-4 w-4"/>Share</Button>
                </div>
                <Card className="max-w-4xl mx-auto w-full">
                     <CardHeader className="flex flex-col md:flex-row justify-between gap-4 bg-muted/50 p-6">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-primary">INVOICE</h2>
                            <p className="text-muted-foreground"># {invoice.invoiceNumber}</p>
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
                                <div className="flex justify-between font-bold text-lg"><span >Grand Total</span><span>{formatCurrency(invoice.grandTotal, invoice.currency)}</span></div>
                            </div>
                        </div>
                        {invoice.notes && (
                            <div>
                                <h4 className="font-semibold">Notes</h4>
                                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                            </div>
                        )}
                    </CardContent>
                     <CardFooter className="bg-muted/50 p-6 flex-col md:flex-row gap-4 justify-between">
                         <p className="text-sm text-muted-foreground">Pay with Payvost for a secure and seamless experience.</p>
                         <Button size="lg" onClick={handlePayNow} disabled={invoice.status === 'Paid'}>
                            {invoice.status === 'Paid' ? 'Paid' : `Pay ${formatCurrency(invoice.grandTotal, invoice.currency)} Now`}
                         </Button>
                    </CardFooter>
                </Card>
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
                            <Button onClick={handleCopyDetails} variant="secondary"><Copy className="mr-2 h-4 w-4"/>Copy Details</Button>
                            <Button onClick={() => setIsManualPaymentDialogOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}

    