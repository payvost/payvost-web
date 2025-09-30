
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FileDown, ListFilter, MoreHorizontal, PlusCircle, Search, FileText, Clock, CircleDollarSign } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function AdminInvoicingPage() {
    const router = useRouter();
    
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Invoice Management</h2>
                    <p className="text-muted-foreground">Oversee all invoices generated on the platform.</p>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline"><FileDown className="mr-2 h-4 w-4" />Export Data</Button>
                    <Button><PlusCircle className="mr-2 h-4 w-4" />Create Invoice</Button>
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
                        <p className="text-xs text-muted-foreground">From 2 pending invoices</p>
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
            
            <Tabs defaultValue="all">
                 <div className="flex items-center justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="overdue">Overdue</TabsTrigger>
                        <TabsTrigger value="paid">Paid</TabsTrigger>
                    </TabsList>
                     <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search invoice ID or customer..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                            />
                        </div>
                        <DateRangePicker />
                    </div>
                </div>

                 <Card className="mt-4">
                    <CardContent className="p-0">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sampleInvoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell>
                                            <div className="font-medium">{invoice.customer}</div>
                                            <div className="text-sm text-muted-foreground">{invoice.user}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant[invoice.status]} className="capitalize">{invoice.status}</Badge>
                                        </TableCell>
                                        <TableCell>{invoice.dueDate}</TableCell>
                                        <TableCell className="text-right font-mono">{invoice.amount}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                                                    <DropdownMenuItem>Send Reminder</DropdownMenuItem>
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
                            Showing <strong>1-5</strong> of <strong>{sampleInvoices.length}</strong> invoices
                        </div>
                    </CardFooter>
                </Card>
            </Tabs>
        </>
    )
}
