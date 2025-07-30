
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Repeat, Search, Edit } from 'lucide-react';
import { Input } from './ui/input';

const sampleRecurringInvoices = [
  { id: 'REC-001', customer: 'Stark Industries', amount: '$10,000.00', frequency: 'Monthly', nextDate: '2024-09-01', status: 'Active' },
  { id: 'REC-002', customer: 'Wayne Enterprises', amount: '$2,500.00', frequency: 'Weekly', nextDate: '2024-08-22', status: 'Active' },
  { id: 'REC-003', customer: 'Acme Inc.', amount: '$500.00', frequency: 'Monthly', nextDate: '2024-09-15', status: 'Paused' },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
  Active: 'default',
  Paused: 'secondary',
  Cancelled: 'destructive',
};

interface RecurringInvoiceViewProps {
    onCreateClick: () => void;
}

export function RecurringInvoiceView({ onCreateClick }: RecurringInvoiceViewProps) {
  const [invoices, setInvoices] = useState(sampleRecurringInvoices);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recurring Invoices</CardTitle>
            <CardDescription>Manage your automated billing schedules.</CardDescription>
          </div>
          <Button onClick={onCreateClick}><PlusCircle className="mr-2 h-4 w-4"/>Schedule Invoice</Button>
        </div>
        <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by customer..."
                className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
            />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Next Invoice</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.customer}</TableCell>
                <TableCell>{invoice.amount}</TableCell>
                <TableCell>{invoice.frequency}</TableCell>
                <TableCell>{invoice.nextDate}</TableCell>
                <TableCell className="text-right">
                    <Badge variant={statusVariant[invoice.status]}>{invoice.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem><Edit className="mr-2 h-4 w-4"/>Edit Schedule</DropdownMenuItem>
                            <DropdownMenuItem>View Invoices</DropdownMenuItem>
                            <DropdownMenuItem>Pause</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
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
            Showing <strong>1-{invoices.length}</strong> of <strong>{invoices.length}</strong> recurring invoices
        </div>
      </CardFooter>
    </Card>
  );
}
