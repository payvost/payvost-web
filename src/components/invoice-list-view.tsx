
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, FileText, Search } from 'lucide-react';
import { Input } from './ui/input';

const sampleInvoices = [
  { id: 'INV-1234', customer: 'Acme Inc.', user: 'john.doe@acme.com', amount: '$2,500.00', dueDate: '2024-08-15', status: 'Paid' },
  { id: 'INV-1235', customer: 'Stark Industries', user: 'tony.stark@stark.com', amount: '$10,000.00', dueDate: '2024-08-20', status: 'Pending' },
  { id: 'INV-1236', customer: 'Wayne Enterprises', user: 'bruce.wayne@wayne.com', amount: '$5,250.75', dueDate: '2024-07-30', status: 'Overdue' },
  { id: 'INV-1237', customer: 'Ollivanders Wand Shop', user: 'garick@ollivanders.co.uk', amount: '$350.00', dueDate: '2024-08-10', status: 'Draft' },
  { id: 'INV-1238', customer: 'Cyberdyne Systems', user: 'miles.dyson@cyberdyne.com', amount: '$1,200.00', dueDate: '2024-08-25', status: 'Pending' },
];

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
  const [invoices, setInvoices] = useState(sampleInvoices);

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
                <Button onClick={onCreateClick}><PlusCircle className="mr-2 h-4 w-4" />Create New Invoice</Button>
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
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>{invoice.customer}</TableCell>
                <TableCell>{invoice.amount}</TableCell>
                <TableCell>{invoice.dueDate}</TableCell>
                <TableCell className="text-right">
                    <Badge variant={statusVariant[invoice.status]}>{invoice.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>View</DropdownMenuItem>
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
