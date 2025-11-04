'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer, Download, Send, CheckCircle, Clock, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
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

export default function BusinessInvoiceDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const { user, loading: authLoading } = useAuth();
    const [invoice, setInvoice] = useState<DocumentData | null>(null);
    const [businessProfile, setBusinessProfile] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const functionsBase = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'https://us-central1-payvost.cloudfunctions.net/api2';


    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const fetchInvoice = async () => {
            try {
                // Fetch invoice document directly (like regular invoices do)
                const docRef = doc(db, 'businessInvoices', id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const invoiceData = docSnap.data();
                    setInvoice({ id: docSnap.id, ...invoiceData });
                    
                    // Load business profile if user is authenticated
                    if (user) {
                        const userDocRef = doc(db, 'users', user.uid);
                        const userSnap = await getDoc(userDocRef);
                        if (userSnap.exists()) {
                            setBusinessProfile(userSnap.data().businessProfile || null);
                        }
                    }
                } else {
                    setInvoice(null);
                }
            } catch (error) {
                console.error("Error fetching invoice:", error);
                setInvoice(null);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [user, id]);
    
    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64"/>
                <Card><CardContent className="pt-6"><Skeleton className="h-96 w-full"/></CardContent></Card>
            </div>
        )
    }

    if (!invoice) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 p-4 lg:gap-6 lg:p-6 text-center h-full">
                <AlertTriangle className="h-16 w-16 text-destructive"/>
                <h2 className="text-2xl font-bold">Invoice Not Found</h2>
                <p className="text-muted-foreground">The requested invoice could not be found.</p>
                 <Button asChild>
                    <Link href="/business/invoices">Back to Invoices</Link>
                </Button>
            </div>
        )
    }

    const currentStatus = invoice.status as Status;
    const currentStatusInfo = statusInfo[currentStatus];

    const formatCurrency = (amount: number, currency: string) => {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
        } catch (e) {
            const symbol = currencySymbols[currency] || currency;
            return `${symbol}${(amount || 0).toFixed(2)}`;
        }
    };

    const subtotal = invoice.items.reduce((acc: number, item: any) => acc + (item.quantity || 0) * (item.price || 0), 0);
    const grandTotal = invoice.grandTotal || 0;
    const taxAmount = grandTotal - subtotal;

    return (
        <div className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/business/invoices">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Invoice Details</h1>
                    </div>
                </div>
                 <div className="flex gap-2">
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4"/>Print</Button>
                    <a href={`${functionsBase}/download/invoice/${id}`} download>
                        <Button variant="outline"><Download className="mr-2 h-4 w-4"/>Download PDF</Button>
                    </a>
                    <Button><Send className="mr-2 h-4 w-4"/>Resend Invoice</Button>
                </div>
            </div>

            <Card className="max-w-5xl mx-auto w-full">
                 <CardHeader className="flex flex-col md:flex-row justify-between gap-4 bg-muted/50 p-6">
                    <div className="flex-1 flex items-center gap-4">
                        {businessProfile?.invoiceLogoUrl && (
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
                     <div className="grid grid-cols-3 gap-8">
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
                        <div className="space-y-1 text-right">
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
                            <div className="flex justify-between font-bold text-lg"><span >Grand Total</span><span>{formatCurrency(grandTotal, invoice.currency)}</span></div>
                        </div>
                    </div>
                    {invoice.notes && (
                        <div>
                            <h4 className="font-semibold">Notes</h4>
                            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                    <p>Thank you for your business! If you have any questions, please contact us at {businessProfile?.email || user?.email}.</p>
                </CardFooter>
            </Card>
        </div>
    )
}
