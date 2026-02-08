
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileDown,
  ListFilter,
  MoreHorizontal,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface Transaction {
  id: string;
  customer: { name: string; email: string };
  type: 'Inflow' | 'Outflow';
  status: 'Successful' | 'Pending' | 'Failed';
  channel: string;
  currency: string;
  risk: 'Low' | 'Medium' | 'High';
  date: string;
  amount: number;
}

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

interface TransactionStats {
  totalVolume: number;
  totalCount: number;
  successfulCount: number;
  pendingCount: number;
  failedCount: number;
  successRate: number;
  avgTransactionValue: number;
}

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<TransactionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [filterType, setFilterType] = useState<string[]>(['Inflow', 'Outflow']);
    const [filterCurrency, setFilterCurrency] = useState<string[]>([]);
    const [filterChannel, setFilterChannel] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { toast } = useToast();

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                limit: '50',
                page: page.toString(),
                status: activeTab === 'all' ? '' : activeTab,
            });
            
            if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());
            if (filterCurrency.length > 0) params.append('currency', filterCurrency[0]);

            const response = await axios.get(`/api/admin/dashboard/transactions?${params}`);
            
            const txData = response.data.transactions || [];
            const formattedTransactions: Transaction[] = txData.map((tx: any) => ({
                id: tx.id,
                customer: { name: tx.customer || 'Unknown', email: tx.email || 'No email' },
                type: tx.amount >= 0 ? 'Inflow' : 'Outflow',
                status: tx.status === 'completed' ? 'Successful' : tx.status === 'pending' ? 'Pending' : 'Failed',
                channel: tx.channel || 'Unknown',
                currency: tx.currency || 'USD',
                risk: tx.risk || 'Low',
                date: tx.date,
                amount: Math.abs(tx.amount || 0),
            }));

            setTransactions(formattedTransactions);
            
            // Calculate stats
            const totalVolume = formattedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
            const successfulCount = formattedTransactions.filter(tx => tx.status === 'Successful').length;
            const pendingCount = formattedTransactions.filter(tx => tx.status === 'Pending').length;
            const failedCount = formattedTransactions.filter(tx => tx.status === 'Failed').length;
            
            setStats({
                totalVolume,
                totalCount: formattedTransactions.length,
                successfulCount,
                pendingCount,
                failedCount,
                successRate: formattedTransactions.length > 0 ? (successfulCount / formattedTransactions.length) * 100 : 0,
                avgTransactionValue: formattedTransactions.length > 0 ? totalVolume / formattedTransactions.length : 0,
            });
        } catch (error: any) {
            console.error('Error fetching transactions:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to load transactions',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [activeTab, page, dateRange, filterCurrency]);

    const filteredTransactions = transactions.filter(tx => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!tx.customer.name.toLowerCase().includes(query) &&
                !tx.customer.email.toLowerCase().includes(query) &&
                !tx.id.toLowerCase().includes(query)) {
                return false;
            }
        }
        if (filterType.length > 0 && !filterType.includes(tx.type)) return false;
        if (filterCurrency.length > 0 && !filterCurrency.includes(tx.currency)) return false;
        if (filterChannel.length > 0 && !filterChannel.includes(tx.channel)) return false;
        return true;
    });

    const handleExport = async () => {
        try {
            const csvContent = [
                ['ID', 'Customer', 'Email', 'Type', 'Status', 'Channel', 'Currency', 'Amount', 'Date'].join(','),
                ...filteredTransactions.map(tx => [
                    tx.id,
                    `"${tx.customer.name}"`,
                    tx.customer.email,
                    tx.type,
                    tx.status,
                    tx.channel,
                    tx.currency,
                    tx.amount,
                    tx.date,
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            toast({
                title: 'Export successful',
                description: 'Transactions exported to CSV',
            });
        } catch (error) {
            toast({
                title: 'Export failed',
                description: 'Failed to export transactions',
                variant: 'destructive',
            });
        }
    };

    const renderTransactionsTable = (data: Transaction[]) => {
        if (loading) {
            return (
                <div className="space-y-4 p-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            );
        }

        if (data.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No transactions found</p>
                </div>
            );
        }

        return (
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
                    {data.map((tx) => {
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
                                <TableCell className="hidden md:table-cell">
                                    <Badge variant={tx.type === 'Inflow' ? 'default' : 'secondary'}>
                                        {tx.type}
                                    </Badge>
                                </TableCell>
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
                                        <DropdownMenuItem asChild>
                                            <Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/transactions/${tx.id}`}>
                                                View Details
                                            </Link>
                                        </DropdownMenuItem>
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
    };

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
                    <p className="text-muted-foreground">Manage and review all platform transactions.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalVolume)}
                            </div>
                            <p className="text-xs text-muted-foreground">All transactions</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.successfulCount} of {stats.totalCount} successful
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingCount}</div>
                            <p className="text-xs text-muted-foreground">Awaiting processing</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Value</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.avgTransactionValue)}
                            </div>
                            <p className="text-xs text-muted-foreground">Per transaction</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem 
                                    checked={filterType.includes('Inflow')}
                                    onCheckedChange={(checked) => {
                                        setFilterType(checked 
                                            ? [...filterType, 'Inflow']
                                            : filterType.filter(t => t !== 'Inflow')
                                        );
                                    }}
                                >
                                    Inflow
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem 
                                    checked={filterType.includes('Outflow')}
                                    onCheckedChange={(checked) => {
                                        setFilterType(checked 
                                            ? [...filterType, 'Outflow']
                                            : filterType.filter(t => t !== 'Outflow')
                                        );
                                    }}
                                >
                                    Outflow
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Filter by Currency</DropdownMenuLabel>
                                {['USD', 'EUR', 'GBP', 'NGN'].map(currency => (
                                    <DropdownMenuCheckboxItem 
                                        key={currency}
                                        checked={filterCurrency.includes(currency)}
                                        onCheckedChange={(checked) => {
                                            setFilterCurrency(checked 
                                                ? [...filterCurrency, currency]
                                                : filterCurrency.filter(c => c !== currency)
                                            );
                                        }}
                                    >
                                        {currency}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DateRangePicker 
                            date={dateRange}
                            onDateChange={setDateRange}
                        />
                        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
                            <Download className="h-3.5 w-3.5" />
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
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                         <TabsContent value="all">
                            {renderTransactionsTable(filteredTransactions)}
                        </TabsContent>
                        <TabsContent value="successful">
                            {renderTransactionsTable(filteredTransactions.filter(t => t.status === 'Successful'))}
                        </TabsContent>
                        <TabsContent value="pending">
                            {renderTransactionsTable(filteredTransactions.filter(t => t.status === 'Pending'))}
                        </TabsContent>
                        <TabsContent value="failed">
                            {renderTransactionsTable(filteredTransactions.filter(t => t.status === 'Failed'))}
                        </TabsContent>
                    </CardContent>
                     <CardFooter>
                        <div className="flex items-center justify-between w-full">
                            <div className="text-xs text-muted-foreground">
                                Showing <strong>1-{filteredTransactions.length}</strong> of <strong>{filteredTransactions.length}</strong> transactions
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1 || loading}
                                >
                                    Previous
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= totalPages || loading}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardFooter>
                </Card>
            </Tabs>
        </>
    );
}
