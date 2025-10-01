
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, FileText, Search } from 'lucide-react';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, DocumentData, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import Link from 'next/link';

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Paid: 'default',
  Pending: 'secondary',
  Overdue: 'destructive',
  Draft: 'outline',
};

interface InvoiceListViewProps {
    onCreateClick: () => void;
}

export function InvoiceListView({ onCreateClick }: InvoiceListViewProps) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    const q = query(
        collection(db, "users", user.uid, "invoices"),
        orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const invoicesData: DocumentData[] = [];
        querySnapshot.forEach((doc) => {
            invoicesData.push({ id: doc.id, ...doc.data() });
        });
        setInvoices(invoicesData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching invoices: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>
                 <div className="relative mt-4">
                    <Skeleton className="h-10 w-full md:w-[320px]" />
                </div>
            </CardHeader>
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
            <Button onClick={onCreateClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create First Invoice
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Manage and track all your business invoices.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
                <Button onClick={onCreateClick}><PlusCircle className="mr-2 h-4 w-4"/>Create New Invoice</Button>
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
                <TableCell>{invoice.dueDate.toDate().toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                    <Badge variant={statusVariant[invoice.status]}>{invoice.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/request-payment/invoice/${invoice.id}`}>View</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Download PDF</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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
  );
}
