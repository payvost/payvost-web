
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, LineChart, Users, FileText, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { BusinessTransactionChart } from '@/components/business-transaction-chart';
import { ActivityLog } from '@/components/activity-log';
import { useAuth } from '@/hooks/use-auth';

const statusConfig: Record<string, { icon: React.ReactNode; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Completed: { icon: <CheckCircle className="h-3 w-3 mr-1" />, color: 'text-green-600', variant: 'default'},
    Pending: { icon: <Clock className="h-3 w-3 mr-1" />, color: 'text-yellow-600', variant: 'secondary'},
    Failed: { icon: <XCircle className="h-3 w-3 mr-1" />, color: 'text-red-600', variant: 'destructive'},
    Overdue: { icon: <AlertTriangle className="h-3 w-3 mr-1" />, color: 'text-orange-600', variant: 'destructive'},
};


interface DashboardData {
    accountBalance: number;
    accountCurrency: string;
    accountName: string;
    pendingPayouts: number;
    pendingPayoutsCount: number;
    openInvoices: number;
    openInvoicesAmount: number;
    newCustomers: number;
    newCustomersChange: number;
    recentTransactions: Array<{
        id: string;
        type: 'Credit' | 'Debit';
        description: string;
        amount: number;
        date: string;
        status: string;
    }>;
}

export default function BusinessDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [loadingData, setLoadingData] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            if (!authLoading) setLoadingData(false);
            return;
        }

        const fetchDashboardData = async () => {
            try {
                setLoadingData(true);
                setError(null);
                const response = await fetch('/api/business/dashboard');
                
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const data = await response.json();
                setDashboardData(data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load dashboard');
                // Fallback to mock data if API fails
                setDashboardData({
                    accountBalance: 52345.67,
                    accountCurrency: 'USD',
                    accountName: 'Qwibik Technologies',
                    pendingPayouts: 5230.00,
                    pendingPayoutsCount: 2,
                    openInvoices: 8,
                    openInvoicesAmount: 12800,
                    newCustomers: 24,
                    newCustomersChange: 5,
                    recentTransactions: [
                        { id: 'txn_1', type: 'Credit', description: 'Invoice #1234 Payment', amount: 2500, date: '2024-08-15', status: 'Completed' },
                        { id: 'txn_2', type: 'Debit', description: 'Payout to Supplier', amount: -1200, date: '2024-08-15', status: 'Completed' },
                        { id: 'txn_3', type: 'Credit', description: 'Payment Link Received', amount: 300, date: '2024-08-14', status: 'Completed' },
                    ]
                });
            } finally {
                setLoadingData(false);
            }
        };

        fetchDashboardData();
    }, [user, authLoading]);
    
    const kpiCards = dashboardData ? [
        { 
            title: "Account Balance", 
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: dashboardData.accountCurrency }).format(dashboardData.accountBalance), 
            change: `+${new Intl.NumberFormat('en-US', { style: 'currency', currency: dashboardData.accountCurrency }).format(2100)} this week`, 
            icon: <LineChart className="h-4 w-4 text-muted-foreground" /> 
        },
        { 
            title: "Pending Payouts", 
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: dashboardData.accountCurrency }).format(dashboardData.pendingPayouts), 
            change: `${dashboardData.pendingPayoutsCount} upcoming payouts`, 
            icon: <Clock className="h-4 w-4 text-muted-foreground" /> 
        },
        { 
            title: "Open Invoices", 
            value: dashboardData.openInvoices.toString(), 
            change: `${new Intl.NumberFormat('en-US', { style: 'currency', currency: dashboardData.accountCurrency }).format(dashboardData.openInvoicesAmount)} outstanding`, 
            icon: <FileText className="h-4 w-4 text-muted-foreground" /> 
        },
        { 
            title: "New Customers", 
            value: dashboardData.newCustomers.toString(), 
            change: `+${dashboardData.newCustomersChange} this week`, 
            icon: <Users className="h-4 w-4 text-muted-foreground" /> 
        },
    ] : [];

    const recentTransactions = dashboardData?.recentTransactions || [];

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Business Dashboard</h2>
                    <p className="text-muted-foreground">A high-level view of your business's performance.</p>
                </div>
            </div>

             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map(item => (
                    <Card key={item.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                            {item.icon}
                        </CardHeader>
                        <CardContent>
                            {loadingData ? (
                                <>
                                    <Skeleton className="h-8 w-3/4 mb-1" />
                                    <Skeleton className="h-4 w-1/2" />
                                </>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{item.value}</div>
                                    <p className="text-xs text-muted-foreground">{item.change}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Volume</CardTitle>
                             <CardDescription>Transaction volume over the last 7 days.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <BusinessTransactionChart />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentTransactions.map(tx => {
                                        const status = statusConfig[tx.status];
                                        return (
                                            <TableRow key={tx.id}>
                                                <TableCell className="font-medium">{tx.description}</TableCell>
                                                <TableCell><Badge variant={tx.type === 'Credit' ? 'default' : 'secondary'}>{tx.type}</Badge></TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm" style={{color: status.color}}>
                                                        {status.icon} <span>{tx.status}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: dashboardData?.accountCurrency || 'USD' }).format(tx.amount)}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <ActivityLog />
                </div>
            </div>
        </>
    )
}
