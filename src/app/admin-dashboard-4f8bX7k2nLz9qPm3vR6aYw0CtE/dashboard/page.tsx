
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ChevronDown, Globe, Landmark, TrendingUp, LineChart, Loader2 } from 'lucide-react';
import { AdminWorldMap } from '@/components/admin-world-map';
import { AdminCurrencyPieChart } from '@/components/admin-currency-pie-chart';
import { AdminTransactionOverviewChart } from '@/components/admin-transaction-overview-chart';
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';

interface DashboardStats {
  totalVolume: number;
  activeUsers: number;
  totalUsers: number;
  totalPayouts: number;
  avgTransactionValue: number;
  transactionCount: number;
  growth: {
    volume: number;
    activeUsers: number;
    payouts: number;
    avgValue: number;
  };
}

interface Transaction {
  id: string;
  customer: string;
  email: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  date: string;
  description: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats and transactions in parallel
        const [statsResponse, transactionsResponse] = await Promise.all([
          axios.get('/api/admin/dashboard/stats'),
          axios.get('/api/admin/dashboard/transactions?limit=10'),
        ]);

        setStats(statsResponse.data);
        setTransactions(transactionsResponse.data.transactions || []);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      completed: 'Successful',
      success: 'Successful',
      processing: 'Processing',
      pending: 'Processing',
      failed: 'Failed',
      cancelled: 'Failed',
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const kpiCards = [
    {
      title: 'Total Volume',
      value: loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(stats?.totalVolume || 0),
      change: loading ? <Skeleton className="h-4 w-24" /> : `+${stats?.growth.volume || 0}% vs last month`,
      icon: <LineChart className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Active Users',
      value: loading ? <Skeleton className="h-8 w-20" /> : `${stats?.activeUsers || 0}`,
      change: loading ? <Skeleton className="h-4 w-24" /> : `+${stats?.growth.activeUsers || 0}% from last month`,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Total Payouts',
      value: loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(stats?.totalPayouts || 0),
      change: loading ? <Skeleton className="h-4 w-24" /> : `+${stats?.growth.payouts || 0}% from last month`,
      icon: <Landmark className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Avg. Transaction Value',
      value: loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(stats?.avgTransactionValue || 0),
      change: loading ? <Skeleton className="h-4 w-24" /> : `+${stats?.growth.avgValue || 0}% vs last month`,
      icon: <Globe className="h-4 w-4 text-muted-foreground" />,
    },
  ];
    return (
        <>
            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="text-sm text-destructive">⚠️ {error}</p>
                </div>
            )}

            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">A high-level view of your platform's performance.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <DateRangePicker />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                All Currencies <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>All Currencies</DropdownMenuItem>
                            <DropdownMenuItem>USD</DropdownMenuItem>
                            <DropdownMenuItem>EUR</DropdownMenuItem>
                            <DropdownMenuItem>GBP</DropdownMenuItem>
                            <DropdownMenuItem>NGN</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                            <div className="text-2xl font-bold">{item.value}</div>
                            <div className="text-xs text-muted-foreground">{item.change}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Transaction Volume</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <AdminTransactionOverviewChart />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Currency Distribution</CardTitle>
                        <CardDescription>Breakdown of total transaction volume by currency.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <AdminCurrencyPieChart />
                    </CardContent>
                </Card>
            </div>
            
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>A list of the most recent transactions on the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-sm">No transactions yet</p>
                            <p className="text-muted-foreground text-xs mt-2">Transactions will appear here once users start making transfers</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell>
                                            <div className="font-medium">{tx.customer}</div>
                                            <div className="text-sm text-muted-foreground">{tx.email}</div>
                                        </TableCell>
                                        <TableCell>{formatStatus(tx.status)}</TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(tx.amount, tx.currency)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
