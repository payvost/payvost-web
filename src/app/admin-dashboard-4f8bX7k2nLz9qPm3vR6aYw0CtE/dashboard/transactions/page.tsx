
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileDown,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { cn } from '@/lib/utils';

const transactions = [
  { id: 'txn_1a2b3c4d', customer: { name: 'Olivia Martin', email: 'olivia.martin@email.com' }, type: 'Inflow', status: 'Successful', channel: 'Stripe', currency: 'USD', risk: 'Low', date: '2024-08-15', amount: 1999.00 },
  { id: 'txn_5e6f7g8h', customer: { name: 'Jackson Lee', email: 'jackson.lee@email.com' }, type: 'Outflow', status: 'Pending', channel: 'Bank Transfer', currency: 'GBP', risk: 'Medium', date: '2024-08-14', amount: 39.00 },
  { id: 'txn_9i0j1k2l', customer: { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com' }, type: 'Inflow', status: 'Failed', channel: 'PayPal', currency: 'EUR', risk: 'High', date: '2024-08-14', amount: 299.00 },
  { id: 'txn_3m4n5o6p', customer: { name: 'William Kim', email: 'will@email.com' }, type: 'Inflow', status: 'Successful', channel: 'Stripe', currency: 'USD', risk: 'Low', date: '2024-08-13', amount: 99.00 },
  { id: 'txn_7q8r9s0t', customer: { name: 'Sofia Davis', email: 'sofia.davis@email.com' }, type: 'Outflow', status: 'Successful', channel: 'Wise', currency: 'AUD', risk: 'Low', date: '2024-08-12', amount: 39.00 },
];

type Status = 'Successful' | 'Pending' | 'Failed';
const statusConfig: Record<Status, { icon: React.ReactNode; color: string }> = {
    Successful: { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
    Pending: { icon: <Clock className="h-4 w-4" />, color: 'text-yellow-600' },
    Failed: { icon: <XCircle className="h-4 w-4" />, color: 'text-red-600' },
};

type Risk = 'Low' | 'Medium' | 'High';
const riskConfig: Record<Risk, { icon: React.ReactNode; color: string }> = {
    Low: { icon: <ShieldCheck className="h-4 w-4" />, color: 'text-green-600' },
    Medium: { icon: <ShieldAlert className="h-4 w-4" />, color: 'text-yellow-600' },
    High: { icon: <ShieldQuestion className="h-4 w-4" />, color: 'text-red-600' },
};


export default function AdminTransactionsPage() {
    const renderTransactionsTable = (filteredTransactions: typeof transactions) => (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Channel</TableHead>
              <TableHead className="hidden sm:table-cell">Risk Level</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((tx) => {
                const status = statusConfig[tx.status as Status];
                const risk = riskConfig[tx.risk as Risk];
                return (
                    <TableRow key={tx.id}>
                        <TableCell>
                            <div className="font-medium">{tx.customer.name}</div>
                            <div className="hidden text-sm text-muted-foreground md:inline">
                                {tx.customer.email}
                            </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{tx.type}</TableCell>
                        <TableCell className="hidden md:table-cell">{tx.channel}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                            <div className={cn("flex items-center gap-1.5", risk.color)}>
                                {risk.icon}
                                <span className="font-medium">{tx.risk}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(tx.amount)}
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild><Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/transactions/${tx.id}`}>View Details</Link></DropdownMenuItem>
                                <DropdownMenuItem>Flag for Review</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">Open Dispute</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
    );

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
                    <p className="text-muted-foreground">Manage and review all platform transactions.</p>
                </div>
            </div>
            <Tabs defaultValue="all">
                <div className="flex items-center justify-between gap-4">
                     <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="successful">Successful</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="failed">Failed</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 gap-1">
                                <ListFilter className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem checked>Inflow</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>Outflow</DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem>USD</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>GBP</DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DateRangePicker />
                        <Button size="sm" variant="outline" className="h-8 gap-1">
                            <FileDown className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
                        </Button>
                    </div>
                </div>
                <Card className="mt-4">
                    <CardHeader>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by customer email or transaction ID..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                         <TabsContent value="all">
                            {renderTransactionsTable(transactions)}
                        </TabsContent>
                        <TabsContent value="successful">
                            {renderTransactionsTable(transactions.filter(t => t.status === 'Successful'))}
                        </TabsContent>
                        <TabsContent value="pending">
                            {renderTransactionsTable(transactions.filter(t => t.status === 'Pending'))}
                        </TabsContent>
                        <TabsContent value="failed">
                            {renderTransactionsTable(transactions.filter(t => t.status === 'Failed'))}
                        </TabsContent>
                    </CardContent>
                     <CardFooter>
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>1-5</strong> of <strong>25</strong> transactions
                        </div>
                    </CardFooter>
                </Card>
            </Tabs>
        </>
    );
}
