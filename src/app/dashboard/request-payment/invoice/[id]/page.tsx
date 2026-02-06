'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
import { InvoiceDisplay } from '@/components/invoice-display';
import '@/styles/invoice-print.css';
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

export default function InvoiceDetailsPage() {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const [invoice, setInvoice] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [forcePrintLayout, setForcePrintLayout] = useState(false);
    const shouldAutoPrint = searchParams.get('print') === '1' || searchParams.get('download') === '1';

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

    const buildPublicPrintUrl = (baseUrl: string, params: Record<string, string>) => {
        const url = baseUrl.startsWith('http') ? new URL(baseUrl) : new URL(baseUrl, window.location.origin);
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
        return url.toString();
    };

    const getPreferredPrintUrl = (params: Record<string, string>) => {
        if (!id) return null;
        const publicBase = invoice?.publicUrl || (invoice?.isPublic ? `/invoice/${id}` : null);
        if (publicBase) {
            return buildPublicPrintUrl(publicBase, params);
        }
        return buildPublicPrintUrl(`/dashboard/request-payment/invoice/${id}`, params);
    };

    const handleDownloadInvoice = () => {
        if (!id) return;
        setForcePrintLayout(true);
        setTimeout(() => window.print(), 200);
        toast({
            title: "Preparing Download",
            description: "A print-optimized view will open. Choose “Save as PDF” in the print dialog.",
        });
    };

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

    const status = String(invoice.status || 'Draft');

    return (
        <DashboardLayout language={language} setLanguage={setLanguage}>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="invoice-actions flex items-center justify-between space-y-2">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                            <Link href="/dashboard/request-payment?tab=invoice">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold md:text-2xl">Invoice #{String(invoice.invoiceNumber || invoice.id)}</h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="default">{status}</Badge>
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
                    <InvoiceDisplay invoice={invoice} showActionButtons={false} />
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

