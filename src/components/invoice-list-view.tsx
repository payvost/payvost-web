
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, FileText, Search, Link as LinkIcon, Share2, Trash2, Loader2, Copy, Edit, CheckCircle } from 'lucide-react';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/use-auth';
import type { DocumentData } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
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
} from "@/components/ui/alert-dialog"

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Paid: 'default',
  Pending: 'secondary',
  Overdue: 'destructive',
  Draft: 'outline',
};

interface InvoiceListViewProps {
    onCreateClick: () => void;
    onEditClick: (invoiceId: string) => void;
    isKycVerified: boolean;
}

export function InvoiceListView({ onCreateClick, onEditClick, isKycVerified }: InvoiceListViewProps) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [invoiceToDelete, setInvoiceToDelete] = useState<DocumentData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/v1/invoices?invoiceType=USER`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error(`Failed to load invoices (${res.status})`);
        }

        const data = await res.json();
        if (cancelled) return;
        const invoicesData = Array.isArray(data?.invoices) ? data.invoices : [];
        setInvoices(invoicesData);
      } catch (e: any) {
        console.error('Error fetching invoices:', e);
        if (!cancelled) {
          toast({ title: 'Error', description: e?.message || 'Failed to load invoices', variant: 'destructive' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, toast]);

  const handleCopyLink = (link: string) => {
    if (!link) {
         toast({
            title: "Link Not Available",
            description: "This invoice doesn't have a public link. This may be because it's a draft.",
            variant: "destructive"
        });
        return;
    }
    const url = link.startsWith('http') ? link : `${window.location.origin}${link}`;
    navigator.clipboard.writeText(url);
    toast({
        title: "Link Copied!",
        description: "The public invoice link has been copied.",
    });
  }

  const handleShareInvoice = async (invoice: DocumentData) => {
     if (!invoice.publicUrl) {
        toast({
            title: "Link Not Available",
            description: "Cannot share an invoice without a public link.",
            variant: "destructive"
        });
        return;
    }
    const shareUrl = invoice.publicUrl?.startsWith('http') ? invoice.publicUrl : `${window.location.origin}${invoice.publicUrl}`;
    const shareData = {
        title: `Invoice #${invoice.invoiceNumber}`,
        text: `Here is the invoice from ${invoice.fromName} for ${new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.grandTotal)}.`,
        url: shareUrl
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                // User cancelled the share sheet, do nothing.
            } else if (err.name === 'PermissionDeniedError') {
                handleCopyLink(invoice.publicUrl);
                toast({
                    title: "Sharing Not Allowed",
                    description: "Your browser has blocked sharing. The link has been copied instead.",
                    variant: "destructive"
                });
            } else {
                console.error('Share failed:', err);
                toast({ title: "Share Failed", description: "Could not share the invoice link.", variant: "destructive" });
            }
        }
    } else {
        handleCopyLink(invoice.publicUrl);
        toast({
            title: "Link Copied",
            description: "Sharing is not supported on this browser. The link has been copied to your clipboard instead.",
        });
    }
  };

  const handleDeleteClick = (invoice: DocumentData) => {
      setInvoiceToDelete(invoice);
  }

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    try {
        if (!user) throw new Error('Not authenticated');
        const token = await user.getIdToken();
        const res = await fetch(`/api/v1/invoices/${invoiceToDelete.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store',
        });

        if (!res.ok && res.status !== 204) {
          const err = await res.json().catch(() => null) as any;
          throw new Error(err?.error || `Failed to delete invoice (${res.status})`);
        }

        setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete.id));
        toast({
            title: "Invoice Deleted",
            description: `Invoice #${invoiceToDelete.invoiceNumber} has been deleted.`,
        });
    } catch (error: any) {
        toast({
            title: "Error",
            description: error.message || "Failed to delete invoice. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsDeleting(false);
        setInvoiceToDelete(null);
    }
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
        if (!user) throw new Error('Not authenticated');
        const token = await user.getIdToken();
        const res = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null) as any;
          throw new Error(err?.error || `Failed to mark as paid (${res.status})`);
        }
        setInvoices(invoices.map(inv => inv.id === invoiceId ? { ...inv, status: 'Paid' } : inv));
        toast({
            title: "Invoice Updated",
            description: "The invoice has been marked as paid.",
        });
    } catch (error: any) {
         toast({
            title: "Error",
            description: error.message || "Could not update the invoice status.",
            variant: "destructive",
        });
    }
  }


  if (loading) {
    return (
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            </CardContent>
        </Card>
    );
  }


  if (invoices.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold tracking-tight">You have no invoices</h3>
            <p className="text-sm text-muted-foreground mb-6">Create your first invoice to get started.</p>
            <Button onClick={onCreateClick} disabled={!isKycVerified}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create First Invoice
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Manage and track all your business invoices.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
                <Button onClick={onCreateClick} disabled={!isKycVerified}><PlusCircle className="mr-2 h-4 w-4"/>Create New Invoice</Button>
            </div>
        </div>
        <div className="relative mt-4">
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
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.toName}</TableCell>
                <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.grandTotal)}</TableCell>
                <TableCell>{invoice.dueDate?.toDate?.() ? invoice.dueDate.toDate().toLocaleDateString() : new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                    <Badge variant={statusVariant[String(invoice.status)] || 'outline'}>{String(invoice.status)}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/request-payment/invoice/${invoice.id}`}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                            </DropdownMenuItem>
                            {invoice.status === 'Draft' && (
                                <DropdownMenuItem onClick={() => onEditClick(invoice.id)}>
                                    <Edit className="mr-2 h-4 w-4"/>Edit
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleCopyLink(invoice.publicUrl || '')}>
                                <Copy className="mr-2 h-4 w-4"/>Copy Public Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShareInvoice(invoice)}>
                                <Share2 className="mr-2 h-4 w-4"/>Share Invoice
                            </DropdownMenuItem>
                            {invoice.status !== 'Paid' && (
                                <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4"/>Mark as Paid
                                </DropdownMenuItem>
                            )}
                             <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(invoice)}>
                                <Trash2 className="mr-2 h-4 w-4"/>Delete Invoice
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
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete invoice <strong>{invoiceToDelete?.invoiceNumber}</strong>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteInvoice} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
