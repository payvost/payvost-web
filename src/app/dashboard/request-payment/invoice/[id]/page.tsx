'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, DocumentData, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Copy, Download, Share2, MoreHorizontal, Edit, Trash2, CheckCircle, Printer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Paid: 'default',
  Pending: 'secondary',
  Overdue: 'destructive',
  Draft: 'outline',
};

const currencySymbols: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
};

export default function InvoiceDetailsPage() {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [invoice, setInvoice] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        if (!id) return;

        const invoiceUnsub = onSnapshot(doc(db, "invoices", id), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setInvoice({ id: doc.id, ...data });
            } else {
                setInvoice(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching invoice:", error);
            setLoading(false);
        });

        return () => {
            invoiceUnsub();
        };
    }, [id]);

    const copyLink = (link: string) => {
        if (!link) {
            toast({
                title: "Link Not Available",
                description: "This invoice doesn't have a public link.",
                variant: "destructive"
            });
            return;
        }
        navigator.clipboard.writeText(link);
        toast({
            title: 'Copied to Clipboard!',
            description: 'The invoice link has been copied.',
        });
    };

    const handleMarkAsPaid = async () => {
        if (!id) return;
        try {
            const docRef = doc(db, 'invoices', id);
            await updateDoc(docRef, {
                status: 'Paid',
                paidAt: new Date(),
            });
            toast({
                title: 'Status Updated',
                description: 'The invoice has been marked as paid.',
            });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update invoice status.', variant: 'destructive' });
        }
    };
    
    const handleDelete = async () => {
        if (!id) return;
        try {
            const docRef = doc(db, 'invoices', id);
            await deleteDoc(docRef);
            toast({
                title: 'Invoice Deleted',
                description: 'The invoice has been permanently deleted.',
            });
            router.push('/dashboard/request-payment?tab=invoice');
        } catch (error) {
            toast({ title: 'Error', description: 'Could not delete the invoice.', variant: 'destructive' });
        } finally {
            setShowDeleteDialog(false);
        }
    };

    const handleDownloadInvoice = () => {
        if (!id) return;
        const downloadUrl = `/api/pdf/invoice/${id}`;
        toast({
            title: "Preparing Download",
            description: "Generating your invoice PDF...",
        });
        fetch(downloadUrl)
            .then(async (response) => {
                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    toast({
                        title: "Download Failed",
                        description: `Unable to generate PDF. ${errorText}`,
                        variant: "destructive",
                    });
                    throw new Error(errorText);
                }
                return response.blob();
            })
            .then((blob) => {
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
            });
    };

    const handlePrint = () => {
        if (!id) return;
        const pdfUrl = `/api/pdf/invoice/${id}`;
        window.open(pdfUrl, '_blank');
        toast({
            title: "Opening PDF",
            description: "The invoice PDF will open in a new window.",
        });
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        if (date.toDate && typeof date.toDate === 'function') {
            return format(date.toDate(), 'PPP');
        }
        if (date instanceof Date) {
            return format(date, 'PPP');
        }
        return format(new Date(date), 'PPP');
    };

    if (loading) {
        return (
            <DashboardLayout language={language} setLanguage={setLanguage}>
                <main className="flex-1 p-4 lg:p-6">
                    <Skeleton className="h-8 w-64 mb-6" />
                    <Skeleton className="h-96 w-full mb-6" />
                </main>
            </DashboardLayout>
        );
    }
    
    if (!invoice) {
        return (
            <DashboardLayout language={language} setLanguage={setLanguage}>
                <main className="flex-1 p-4 lg:p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Not Found</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>The invoice you are looking for could not be found.</p>
                        </CardContent>
                    </Card>
                </main>
            </DashboardLayout>
        );
    }

    const subtotal = (invoice.items || []).reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
    const taxAmount = Number(invoice.grandTotal) - subtotal;
    const status = String(invoice.status || 'Draft');
    const statusVar = statusVariant[status] || 'outline';

    return (
        <DashboardLayout language={language} setLanguage={setLanguage}>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between space-y-2">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                            <Link href="/dashboard/request-payment?tab=invoice">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold md:text-2xl">Invoice #{String(invoice.invoiceNumber || invoice.id)}</h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant={statusVar}>{status}</Badge>
                                <span>ID: {String(invoice.id)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {invoice.status !== 'Paid' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark as Paid
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Mark as Paid?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will mark the invoice as paid. This action can be reversed by editing the invoice.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleMarkAsPaid}>Mark as Paid</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        {invoice.publicUrl && (
                            <Button variant="outline" onClick={() => copyLink(invoice.publicUrl)}>
                                <Copy className="mr-2 h-4 w-4" />Copy Link
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleDownloadInvoice}>
                            <Download className="mr-2 h-4 w-4" />Download PDF
                        </Button>
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />Print
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {invoice.status === 'Draft' && (
                                    <DropdownMenuItem asChild>
                                        <Link href={`/dashboard/request-payment?create=true&edit=${invoice.id}`}>
                                            <Edit className="mr-2 h-4 w-4"/>Edit Invoice
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                {invoice.publicUrl && (
                                    <DropdownMenuItem onClick={() => window.open(invoice.publicUrl, '_blank')}>
                                        <Share2 className="mr-2 h-4 w-4"/>View Public Link
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.preventDefault(); setShowDeleteDialog(true);}}>
                                    <Trash2 className="mr-2 h-4 w-4"/>Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                
                <Card>
                    <CardHeader className="flex flex-col md:flex-row justify-between gap-4 bg-muted/50 p-6">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-primary">INVOICE</h2>
                            <p className="text-muted-foreground"># {String(invoice.invoiceNumber || invoice.id)}</p>
                        </div>
                        <div className="text-right">
                            <Badge variant={statusVar} className="capitalize text-lg">
                                {status}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6 md:p-8 space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                            <div className="space-y-1">
                                <h3 className="font-semibold">Billed To</h3>
                                <p className="text-sm">{String(invoice.toName || 'N/A')}</p>
                                {invoice.toAddress && (
                                    <p className="text-sm text-muted-foreground">{String(invoice.toAddress)}</p>
                                )}
                                {invoice.toEmail && (
                                    <p className="text-sm text-muted-foreground">{String(invoice.toEmail)}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold">From</h3>
                                <p className="text-sm">{String(invoice.fromName || 'N/A')}</p>
                                {invoice.fromAddress && (
                                    <p className="text-sm text-muted-foreground">{String(invoice.fromAddress)}</p>
                                )}
                            </div>
                            <div className="space-y-1 text-left md:text-right col-span-2 md:col-span-1">
                                <p><strong className="font-semibold">Issue Date:</strong> {formatDate(invoice.issueDate)}</p>
                                <p><strong className="font-semibold">Due Date:</strong> {formatDate(invoice.dueDate)}</p>
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
                                {(invoice.items || []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No items found.</TableCell>
                                    </TableRow>
                                ) : (
                                    invoice.items.map((item: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{String(item.description || 'N/A')}</TableCell>
                                            <TableCell className="text-center">{Number(item.quantity) || 0}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(Number(item.price) || 0, String(invoice.currency || 'USD'))}</TableCell>
                                            <TableCell className="text-right">{formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0), String(invoice.currency || 'USD'))}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        <div className="flex justify-end">
                            <div className="w-full max-w-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(subtotal, String(invoice.currency || 'USD'))}</span>
                                </div>
                                {invoice.taxRate && Number(invoice.taxRate) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tax ({Number(invoice.taxRate)}%)</span>
                                        <span>{formatCurrency(taxAmount, String(invoice.currency || 'USD'))}</span>
                                    </div>
                                )}
                                <hr className="my-2" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Grand Total</span>
                                    <span>{formatCurrency(Number(invoice.grandTotal) || 0, String(invoice.currency || 'USD'))}</span>
                                </div>
                            </div>
                        </div>

                        {invoice.notes && (
                            <div>
                                <h4 className="font-semibold">Notes</h4>
                                <p className="text-sm text-muted-foreground">{String(invoice.notes)}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete invoice <strong>{String(invoice.invoiceNumber || invoice.id)}</strong> and all of its data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </DashboardLayout>
    );
}

