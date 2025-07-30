
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, DollarSign, FileDown, Landmark, Send, TrendingUp, TrendingDown } from 'lucide-react';
import type { BusinessAccount, AccountTransaction } from '@/types/business-account-summary';

const accounts: BusinessAccount[] = [
    { id: 'acc_1', name: 'Operating Account', balance: 150230.75, currency: 'USD', description: 'For day-to-day business expenses and payroll.' },
    { id: 'acc_2', name: 'Revenue Account', balance: 485350.25, currency: 'USD', description: 'All incoming customer payments land here.' },
    { id: 'acc_3', name: 'Tax Holding Account', balance: 45800.00, currency: 'USD', description: 'Funds set aside for tax obligations.' },
];

const recentTransactions: AccountTransaction[] = [
    { id: 'txn_1', type: 'Credit', description: 'Invoice #INV-1234 Paid', category: 'Invoice Payment', amount: 2500, date: '2024-08-15', status: 'Completed' },
    { id: 'txn_2', type: 'Debit', description: 'Payroll - August Week 2', category: 'Payout', amount: 12500, date: '2024-08-15', status: 'Completed' },
    { id: 'txn_3', type: 'Debit', description: 'Stripe Platform Fees', category: 'Fees', amount: 850.50, date: '2024-08-14', status: 'Completed' },
    { id: 'txn_4', type: 'Credit', description: 'Payment from Acme Inc.', category: 'Invoice Payment', amount: 10000, date: '2024-08-14', status: 'Pending' },
    { id: 'txn_5', type: 'Debit', description: 'Refund for Order #5567', category: 'Refund', amount: 150, date: '2024-08-13', status: 'Completed' },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
  Completed: 'default',
  Pending: 'secondary',
  Failed: 'destructive',
};


const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

export default function AccountSummaryPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Account Summary</h2>
                    <p className="text-muted-foreground">A unified view of your business finances.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline"><FileDown className="mr-2 h-4 w-4" />Export Report</Button>
                    <Button><Send className="mr-2 h-4 w-4" />Make a Payment</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map(account => (
                    <Card key={account.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{account.name}</CardTitle>
                            <CardDescription>{account.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold">{formatCurrency(account.balance, account.currency)}</p>
                                <p className="text-sm text-muted-foreground">{account.currency}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm"><ArrowUpRight className="mr-2 h-4 w-4" />Send</Button>
                            <Button variant="outline" size="sm"><ArrowDownLeft className="mr-2 h-4 w-4" />Fund</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>An overview of recent transactions across all accounts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentTransactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        <div className="font-medium">{tx.description}</div>
                                        <div className="text-sm text-muted-foreground">{tx.date}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{tx.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant[tx.status]}>{tx.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        <span className={tx.type === 'Credit' ? 'text-green-600' : 'text-destructive'}>
                                            {tx.type === 'Credit' ? '+' : '-'}
                                            {formatCurrency(tx.amount, 'USD')}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
