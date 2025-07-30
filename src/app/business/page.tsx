
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecentTransactions } from '@/components/recent-transactions';
import { LineChart, CheckCircle, ArrowRightLeft, Users, FileText, ArrowRight, Smartphone, ShoppingCart, CreditCard, PlusCircle, Wallet, ShieldAlert } from 'lucide-react';
import { abbreviateNumber } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { KycNotification } from '@/components/kyc-notification';


const TransactionChart = dynamic(() => import('@/components/transaction-chart').then(mod => mod.TransactionChart), {
    ssr: false,
    loading: () => <Skeleton className="h-[250px]" />,
});

const kpiCards = [
    { title: "Total Volume", value: 1250000, change: "+15.2% vs last month", icon: <LineChart className="h-4 w-4 text-muted-foreground" />, currency: 'USD' },
    { title: "Successful Payouts", value: 420, change: "+35 vs last month", icon: <CheckCircle className="h-4 w-4 text-muted-foreground" /> },
    { title: "Active Customers", value: 87, change: "+5 new this month", icon: <Users className="h-4 w-4 text-muted-foreground" /> },
    { title: "Pending Invoices", value: 4, change: "$12,500 outstanding", icon: <FileText className="h-4 w-4 text-muted-foreground" /> },
];

const sampleInvoices = [
  { id: 'INV-1235', client: 'Stark Industries', amount: '$10,000.00', status: 'Pending' },
  { id: 'INV-1236', client: 'Wayne Enterprises', amount: '$5,250.75', status: 'Overdue' },
  { id: 'INV-1234', client: 'Acme Inc.', amount: '$2,500.00', status: 'Paid' },
  { id: 'INV-1239', client: 'Gekko & Co', amount: '$8,750.00', status: 'Pending' },
];

const spendingData = [
    { category: 'Team Payouts', amount: 85000, total: 158500, icon: <ArrowRightLeft className="h-5 w-5 text-primary" /> },
    { category: 'Software & Subscriptions', amount: 8500, total: 158500, icon: <Smartphone className="h-5 w-5 text-primary" /> },
    { category: 'Card Spending', amount: 45000, total: 158500, icon: <ShoppingCart className="h-5 w-5 text-primary" /> },
    { category: 'Other', amount: 20000, total: 158500, icon: <CreditCard className="h-5 w-5 text-primary" /> },
];


export default function BusinessDashboardPage() {
     const [isKycVerified, setIsKycVerified] = React.useState(false); // Set to false to show notification

     const formatValue = (value: number, currency?: string) => {
        if (currency) {
            return `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value)}`;
        }
        return abbreviateNumber(value);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Business Dashboard</h2>
                    <p className="text-muted-foreground">Here's a summary of your business activity.</p>
                </div>
                <Button asChild>
                    <Link href="/business/payouts">
                        <ArrowRightLeft className="mr-2 h-4 w-4"/> Make a Payout
                    </Link>
                </Button>
            </div>
            
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map(item => (
                    <Card key={item.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                            {item.icon}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatValue(item.value, item.currency)}</div>
                            <p className="text-xs text-muted-foreground">{item.change}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                <div className="lg:col-span-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cashflow</CardTitle>
                            <CardDescription>Overview of your incoming and outgoing funds.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <TransactionChart />
                        </CardContent>
                    </Card>
                    <RecentTransactions />
                </div>
                 <div className="lg:col-span-3 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Spending Breakdown</CardTitle>
                            <CardDescription>Overview of your spending this month.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {spendingData.map((item) => (
                                <div key={item.category} className="flex items-center gap-4">
                                    <div className="p-3 bg-muted rounded-lg">{item.icon}</div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between">
                                            <p className="text-sm font-medium">{item.category}</p>
                                            <p className="text-sm font-mono">${item.amount.toFixed(2)}</p>
                                        </div>
                                        <Progress value={(item.amount / item.total) * 100} className="h-2" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center">
                            <div className="grid gap-2">
                                <CardTitle>Invoice Overview</CardTitle>
                                <CardDescription>
                                    Recent invoices and their statuses.
                                </CardDescription>
                            </div>
                            <Button asChild size="sm" className="ml-auto gap-1">
                                <Link href="/dashboard/request-payment?tab=invoice">
                                    View All
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sampleInvoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell>
                                                <div className="font-medium">{invoice.client}</div>
                                                <div className="text-sm text-muted-foreground hidden md:inline">{invoice.id}</div>
                                            </TableCell>
                                            <TableCell className="text-right">{invoice.amount}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge 
                                                    variant={
                                                    invoice.status === 'Paid' ? 'default' : 
                                                    invoice.status === 'Pending' ? 'secondary' : 'destructive'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {invoice.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
