
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, FileText, Search, Clock, CircleDollarSign, Edit, Trash2, Send, Copy, Eye, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, DocumentData, doc, deleteDoc, updateDoc } from 'firebase/firestore';
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
            invoicesData.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
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
            const docRef = doc(db, 'businessInvoices', invoiceId);
            await updateDoc(docRef, { status: 'Paid' });
            toast({ title: 'Success', description: 'Invoice marked as paid.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update invoice status.', variant: 'destructive' });
        }
    };
    
    const handleDeleteInvoice = async () => {
        if (!invoiceToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'businessInvoices', invoiceToDelete.id));
            toast({ title: 'Invoice Deleted', description: `Invoice #${invoiceToDelete.invoiceNumber} has been deleted.` });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete invoice.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setInvoiceToDelete(null);
        }
    };
    
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$16,450.75</div>
                    <p className="text-xs text-muted-foreground">From 3 pending/overdue invoices</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$5,250.75</div>
                    <p className="text-xs text-muted-foreground">From 1 overdue invoice</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Payment Time</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">12 Days</div>
                    <p className="text-xs text-muted-foreground">-2 days from last month</p>
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
                            <TableCell>{invoice.toName}</TableCell>
                            <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.grandTotal)}</TableCell>
                            <TableCell>{invoice.dueDate.toDate().toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                                <Badge variant={statusVariant[invoice.status]}>{invoice.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild><Link href={`/business/invoices/${invoice.id}`}><FileText className="mr-2 h-4 w-4" />View Details</Link></DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => window.open(invoice.publicUrl, '_blank')}>
                                            <Eye className="mr-2 h-4 w-4" />View Public Page
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEditClick(invoice.id)} disabled={invoice.status !== 'Draft'}>
                                            <Edit className="mr-2 h-4 w-4" />Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSendReminder(invoice)}>
                                            <Send className="mr-2 h-4 w-4" />Send Reminder
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleCopyLink(invoice.publicUrl)}>
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
