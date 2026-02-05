
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, LineChart, Users, FileText, Clock, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, Receipt, DollarSign, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
    accountBalanceChange?: number;
    accountBalanceChangePercent?: number;
    recentTransactions: Array<{
        id: string;
        type: 'Credit' | 'Debit';
        description: string;
        amount: number;
        date: string;
        status: string;
        invoiceId?: string;
        transactionId?: string;
    }>;
    chartData?: Array<{
        day: string;
        inflow: number;
        outflow: number;
    }>;
}

export default function BusinessDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [loadingData, setLoadingData] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        if (!user) {
            if (!authLoading) setLoadingData(false);
            return;
        }

        try {
            setLoadingData(true);
            setError(null);
            
            // Get Firebase ID token for authentication
            const token = await user.getIdToken();
            
            const response = await fetch('/api/business/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const data = await response.json();
            setDashboardData(data);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            let fallbackSucceeded = false;

            // Fallback to Firestore if API fails
            try {
                console.warn('API call failed, falling back to Firestore for business dashboard');
                const { db } = await import('@/lib/firebase');
                const { doc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore');
                
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (!userDoc.exists()) {
                    throw new Error('User document not found');
                }
                
                const userData = userDoc.data();
                const businessProfile: any = userData.businessProfile || {};
                const businessId = businessProfile.id;
                
                // Get business invoices from Firestore
                let openInvoices = 0;
                let openInvoicesAmount = 0;
                let pendingPayouts = 0;
                let pendingPayoutsCount = 0;
                
                if (businessId) {
                    try {
                        const invoicesQuery = query(
                            collection(db, 'businessInvoices'),
                            where('createdBy', '==', user.uid),
                            where('status', 'in', ['PENDING', 'OVERDUE'])
                        );
                        const invoicesSnapshot = await getDocs(invoicesQuery);
                        
                        invoicesSnapshot.forEach((invoiceDoc) => {
                            const invoice = invoiceDoc.data();
                            openInvoices++;
                            openInvoicesAmount += parseFloat(invoice.grandTotal?.toString() || '0');
                        });
                    } catch (invoiceError) {
                        console.error('Error fetching invoices from Firestore:', invoiceError);
                    }
                }
                
                // Get account balance from wallets
                const wallets = userData.wallets || [];
                const businessWallet = wallets.find((w: any) => w.type === 'BUSINESS' || w.currency === businessProfile.currency);
                const accountBalance = parseFloat(businessWallet?.balance?.toString() || '0');
                const accountCurrency = businessWallet?.currency || businessProfile.currency || 'USD';
                
                // Get recent transactions
                const transactions = userData.transactions || [];
                const recentTransactions = transactions
                    .filter((t: any) => t.businessId === businessId || !businessId)
                    .slice(0, 5)
                    .map((t: any) => ({
                        id: t.id || t.transactionId || `txn_${Date.now()}`,
                        type: t.type || (parseFloat(t.amount) >= 0 ? 'Credit' : 'Debit'),
                        description: t.description || t.note || 'Transaction',
                        amount: parseFloat(t.amount || '0'),
                        date: t.date || t.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                        status: t.status || 'Completed',
                        invoiceId: t.invoiceId,
                        transactionId: t.transactionId,
                    }));
                
                setDashboardData({
                    accountBalance,
                    accountCurrency,
                    accountName: businessProfile.name || 'Business Account',
                    pendingPayouts,
                    pendingPayoutsCount,
                    openInvoices,
                    openInvoicesAmount,
                    newCustomers: 0,
                    newCustomersChange: 0,
                    accountBalanceChange: 0,
                    accountBalanceChangePercent: 0,
                    recentTransactions,
                });
                fallbackSucceeded = true;
                
                console.log('Successfully loaded dashboard data from Firestore fallback');
            } catch (firestoreError) {
                console.error('Firestore fallback also failed, using empty data:', firestoreError);
                // Final fallback to minimal data - try to get business profile name from user doc
                let accountName = 'Business Account';
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        accountName = userData.businessProfile?.name || 'Business Account';
                    }
                } catch (e) {
                    // Ignore errors in final fallback
                }
                
                setDashboardData({
                    accountBalance: 0,
                    accountCurrency: 'USD',
                    accountName,
                    pendingPayouts: 0,
                    pendingPayoutsCount: 0,
                    openInvoices: 0,
                    openInvoicesAmount: 0,
                    newCustomers: 0,
                    newCustomersChange: 0,
                    accountBalanceChange: 0,
                    accountBalanceChangePercent: 0,
                    recentTransactions: [],
                });
                fallbackSucceeded = true;
            }
            
            if (!fallbackSucceeded) {
                setError(err instanceof Error ? err.message : 'Failed to load dashboard');
            } else {
                setError(null);
            }
        } finally {
            setLoadingData(false);
            setRefreshing(false);
        }
    }, [user, authLoading]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

    const formatChange = (change: number | undefined, percent: number | undefined, isPositive: boolean = true) => {
        if (change === undefined && percent === undefined) return null;
        const sign = isPositive ? '+' : '';
        if (percent !== undefined) {
            return `${sign}${percent.toFixed(1)}%`;
        }
        return change !== undefined ? `${sign}${formatCurrency(change, dashboardData?.accountCurrency || 'USD')}` : null;
    };

    const kpiCards = dashboardData ? [
        { 
            title: "Account Balance", 
            value: formatCurrency(dashboardData.accountBalance, dashboardData.accountCurrency),
            change: formatChange(dashboardData.accountBalanceChange, dashboardData.accountBalanceChangePercent, true) || 'No change',
            changeLabel: 'this week',
            isPositive: (dashboardData.accountBalanceChangePercent || 0) >= 0,
            icon: <LineChart className="h-4 w-4 text-muted-foreground" />,
            href: '/business/transactions',
            trend: (dashboardData.accountBalanceChangePercent || 0) >= 0 ? 'up' : 'down'
        },
        { 
            title: "Pending Payouts", 
            value: formatCurrency(dashboardData.pendingPayouts, dashboardData.accountCurrency),
            change: `${dashboardData.pendingPayoutsCount} upcoming payouts`,
            changeLabel: '',
            isPositive: true,
            icon: <Clock className="h-4 w-4 text-muted-foreground" />,
            href: '/business/payouts',
            trend: 'neutral'
        },
        { 
            title: "Open Invoices", 
            value: dashboardData.openInvoices.toString(), 
            change: `${formatCurrency(dashboardData.openInvoicesAmount, dashboardData.accountCurrency)} outstanding`,
            changeLabel: '',
            isPositive: true,
            icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            href: '/business/invoices',
            trend: 'neutral'
        },
        { 
            title: "New Customers", 
            value: dashboardData.newCustomers.toString(), 
            change: `+${dashboardData.newCustomersChange} this week`,
            changeLabel: '',
            isPositive: true,
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
            href: '/business/customers',
            trend: 'up'
        },
    ] : [];

    const recentTransactions = dashboardData?.recentTransactions || [];

    const quickActions = [
        { label: 'Create Invoice', icon: <Receipt className="h-4 w-4" />, href: '/business/invoices/new', variant: 'default' as const },
        { label: 'New Payout', icon: <DollarSign className="h-4 w-4" />, href: '/business/payouts/new', variant: 'outline' as const },
    ];

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Business Dashboard</h2>
                    <p className="text-muted-foreground">A high-level view of your business's performance.</p>
                </div>
                <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleRefresh}
                    disabled={refreshing || loadingData}
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mb-6">
                {quickActions.map((action) => (
                    <Button key={action.label} variant={action.variant} asChild>
                        <Link href={action.href}>
                            {action.icon}
                            <span className="ml-2">{action.label}</span>
                        </Link>
                    </Button>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map(item => (
                    <Card key={item.title} className="hover:shadow-md transition-shadow group">
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
                                    <div className="text-2xl font-bold mb-1">{item.value}</div>
                                    <div className="flex items-center gap-1 text-xs">
                                        {item.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                                        {item.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                                        <span className={`${item.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.change}
                                        </span>
                                        {item.changeLabel && <span className="text-muted-foreground">{item.changeLabel}</span>}
                                    </div>
                                </>
                            )}
                        </CardContent>
                        {item.href && (
                            <CardFooter className="pt-0">
                                <Button variant="ghost" size="sm" className="w-full justify-between group-hover:text-primary" asChild>
                                    <Link href={item.href}>
                                        View details
                                        <ArrowRight className="h-3 w-3 ml-2" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                ))}
            </div>

            <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Transactions</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/business/transactions">
                            View All
                            <ArrowRight className="h-3 w-3 ml-2" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {loadingData ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : recentTransactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No recent transactions</p>
                            <Button variant="outline" size="sm" className="mt-4" asChild>
                                <Link href="/business/transactions">View All Transactions</Link>
                            </Button>
                        </div>
                    ) : (
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
                                {recentTransactions.slice(0, 5).map(tx => {
                                    const status = statusConfig[tx.status] || statusConfig.Pending;
                                    const href = tx.invoiceId 
                                        ? `/business/invoices/${tx.invoiceId}`
                                        : tx.transactionId 
                                            ? `/business/transactions/${tx.transactionId}`
                                            : '/business/transactions';
                                    return (
                                        <TableRow 
                                            key={tx.id} 
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => window.location.href = href}
                                        >
                                            <TableCell className="font-medium">{tx.description}</TableCell>
                                            <TableCell>
                                                <Badge variant={tx.type === 'Credit' ? 'default' : 'secondary'}>
                                                    {tx.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-sm" style={{color: status.color}}>
                                                    {status.icon} <span>{tx.status}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(tx.amount, dashboardData?.accountCurrency || 'USD')}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    )
}
