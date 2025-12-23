'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, FileText, Search, Clock, CircleDollarSign, Edit, Trash2, Send, Copy, Eye, CheckCircle, Loader2, Receipt } from 'lucide-react';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, DocumentData, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Paid: 'default',
  Pending: 'secondary',
  Overdue: 'destructive',
  Draft: 'outline',
};

interface BusinessInvoiceListViewProps {
    onCreateClick: () => void;
    onEditClick: (invoiceId: string) => void;
    isKycVerified: boolean;
}

export function BusinessInvoiceListView({ onCreateClick, onEditClick, isKycVerified }: BusinessInvoiceListViewProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [invoices, setInvoices] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [invoiceToDelete, setInvoiceToDelete] = useState<DocumentData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, "businessInvoices"), where("createdBy", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const invoicesData: DocumentData[] = [];
            querySnapshot.forEach((doc) => {
                invoicesData.push({ id: doc.id, ...doc.data() });
            });
            invoicesData.sort((a, b) => {
                const aTime = a.createdAt?.toDate?.() || new Date(0);
                const bTime = b.createdAt?.toDate?.() || new Date(0);
                return bTime.getTime() - aTime.getTime();
            });
            setInvoices(invoicesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching business invoices: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleCopyLink = (link: string) => {
        if (!link) {
            toast({
                title: "Link Not Available",
                description: "This invoice doesn't have a public link yet (it might be a draft).",
                variant: "destructive"
            });
            return;
        }
        navigator.clipboard.writeText(link);
        toast({ title: "Copied!", description: "Public invoice link copied to clipboard." });
    };

    const handleSendReminder = (invoice: DocumentData) => {
        toast({
            title: "Reminder Sent",
            description: `An email reminder has been sent to ${invoice.toEmail}.`
        });
    };
    
    const handleMarkAsPaid = async (invoiceId: string) => {
        try {
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Get Firebase ID token
            const token = await user.getIdToken();

            // Use backend API endpoint instead of direct Firestore update
            // This ensures proper authorization and handles both Prisma and Firestore invoices
            const response = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                cache: 'no-store',
            });

            if (!response.ok) {
                let errorMessage = 'Failed to update invoice status';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // If response is not JSON, use status text
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Update local state optimistically
            setInvoices(invoices.map(inv => 
                inv.id === invoiceId ? { ...inv, status: 'Paid', paidAt: new Date() } : inv
            ));
            
            toast({ title: 'Success', description: 'Invoice marked as paid.' });
        } catch (error: any) {
            console.error('Error marking invoice as paid:', error);
            toast({ 
                title: 'Error', 
                description: error.message || 'Failed to update invoice status.', 
                variant: 'destructive' 
            });
        }
    };
    
    const handleDeleteInvoice = async () => {
        if (!invoiceToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'businessInvoices', invoiceToDelete.id));
            toast({ title: 'Invoice Deleted', description: `Invoice #${invoiceToDelete.invoiceNumber} has been deleted.` });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to delete invoice.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setInvoiceToDelete(null);
        }
    };

    const outstandingInvoices = invoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue');
    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    const paidInvoices = invoices.filter(inv => inv.status === 'Paid' && inv.paidAt && inv.issueDate);
    const totalPaymentTime = paidInvoices.reduce((sum, inv) => {
        const issueDate = inv.issueDate.toDate();
        const paidAt = inv.paidAt.toDate();
        const diffTime = Math.abs(paidAt.getTime() - issueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
    }, 0);
    const avgPaymentTime = paidInvoices.length > 0 ? Math.round(totalPaymentTime / paidInvoices.length) : 0;


    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    }
    
    return (
        <>
        <div className="flex items-center justify-between space-y-2 mb-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
                <p className="text-muted-foreground">Manage and track all your business invoices.</p>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline">Export Data</Button>
                <Button onClick={onCreateClick} disabled={!isKycVerified}>
                    <PlusCircle className="mr-2 h-4 w-4"/>Create Invoice
                </Button>
            </div>
        </div>

        {!loading && invoices.length === 0 ? (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="rounded-full bg-muted p-6 mb-4">
                        <Receipt className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No invoices yet</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                        Get started by creating your first invoice. Send professional invoices to your clients and track payments all in one place.
                    </p>
                    <Button onClick={onCreateClick} disabled={!isKycVerified} size="lg">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Create Your First Invoice
                    </Button>
                    {!isKycVerified && (
                        <p className="text-sm text-muted-foreground mt-4">
                            Please verify your account to create invoices.
                        </p>
                    )}
                </CardContent>
            </Card>
        ) : (
            <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalOutstanding, 'USD')}</div>
                            <p className="text-xs text-muted-foreground">From {outstandingInvoices.length} pending/overdue invoices</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalOverdue, 'USD')}</div>
                            <p className="text-xs text-muted-foreground">From {overdueInvoices.length} overdue invoice(s)</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Payment Time</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{avgPaymentTime} Days</div>
                            <p className="text-xs text-muted-foreground">Based on paid invoices</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by client or invoice #..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(3)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                    <TableCell>{invoice.toInfo?.name || invoice.toName || 'N/A'}</TableCell>
                                    <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(Number(invoice.grandTotal || 0))}</TableCell>
                                    <TableCell>{invoice.dueDate?.toDate ? new Date(invoice.dueDate.toDate()).toLocaleDateString() : new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={statusVariant[invoice.status]}>{invoice.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild><Link href={`/business/invoices/${invoice.id}`}><FileText className="mr-2 h-4 w-4" />View Details</Link></DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onEditClick(invoice.id)} disabled={invoice.status !== 'Draft'}>
                                                    <Edit className="mr-2 h-4 w-4" />Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSendReminder(invoice)}>
                                                    <Send className="mr-2 h-4 w-4" />Send Reminder
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleCopyLink(invoice.publicUrl || '')}>
                                                    <Copy className="mr-2 h-4 w-4" />Copy Public Link
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                 <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)} disabled={invoice.status === 'Paid'}>
                                                    <CheckCircle className="mr-2 h-4 w-4" />Mark as Paid
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onSelect={(e) => {e.preventDefault(); setInvoiceToDelete(invoice);}}>
                                                    <Trash2 className="mr-2 h-4 w-4"/>Void Invoice
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter>
                         <div className="text-xs text-muted-foreground">
                            Showing <strong>1-{invoices.length}</strong> of <strong>{invoices.length}</strong> invoices
                        </div>
                    </CardFooter>
                </Card>
            </>
        )}

         <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to void this invoice?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone and will permanently delete invoice <strong>#{invoiceToDelete?.invoiceNumber}</strong>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteInvoice} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Void Invoice
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        </>
    );
}
