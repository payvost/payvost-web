
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, FileText, Search, Clock, CircleDollarSign } from 'lucide-react';
import { Input } from './ui/input';

const sampleInvoices = [
  { id: 'INV-B123', customer: 'Acme Inc.', amount: '$2,500.00', dueDate: '2024-08-15', status: 'Paid' },
  { id: 'INV-B124', customer: 'Stark Industries', amount: '$10,000.00', dueDate: '2024-08-20', status: 'Pending' },
  { id: 'INV-B125', customer: 'Wayne Enterprises', amount: '$5,250.75', dueDate: '2024-07-30', status: 'Overdue' },
  { id: 'INV-B126', customer: 'Ollivanders Wand Shop', amount: '$350.00', dueDate: '2024-08-10', status: 'Draft' },
  { id: 'INV-B127', customer: 'Cyberdyne Systems', amount: '$1,200.00', dueDate: '2024-08-25', status: 'Pending' },
];

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
                        {sampleInvoices.map((invoice) => (
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
                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                        <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                                        <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">Void Invoice</DropdownMenuItem>
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
                    Showing <strong>1-{sampleInvoices.length}</strong> of <strong>{sampleInvoices.length}</strong> invoices
                </div>
            </CardFooter>
        </Card>
        </>
    );
}
