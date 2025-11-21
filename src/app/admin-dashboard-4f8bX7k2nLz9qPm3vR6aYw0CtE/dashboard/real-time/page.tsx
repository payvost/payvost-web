
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
    Search, 
    Monitor, 
    Smartphone, 
    Globe, 
    AlertCircle, 
    CheckCircle, 
    Clock, 
    Radio,
    ExternalLink,
    RefreshCw,
    Filter,
    X,
    Download,
    Calendar as CalendarIcon,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Flag,
    Shield,
    TrendingUp,
    DollarSign,
    Activity,
    MoreVertical,
    FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';

type TransactionStatus = 'success' | 'processing' | 'failed' | 'completed' | 'pending';
type RiskLevel = 'low' | 'medium' | 'high';
type DeviceType = 'desktop' | 'mobile' | 'unknown';

interface RealTimeTransaction {
  id: string;
  userId?: string;
  user: string;
  email: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  risk: RiskLevel;
  location: string;
  ip: string;
  device: DeviceType;
  timestamp: Date;
  type?: string;
  description?: string;
}

// Helper function to calculate risk score based on transaction data
function calculateRiskScore(tx: any): RiskLevel {
    let riskScore = 0;
    
    // Failed transactions are higher risk
    if (tx.status === 'failed' || tx.status === 'Failed') riskScore += 3;
    
    // Large amounts are higher risk
    const amount = parseFloat(tx.amount || 0);
    if (amount > 10000) riskScore += 2;
    else if (amount > 5000) riskScore += 1;
    
    // Certain currencies might be higher risk (simplified)
    const highRiskCurrencies = ['NGN', 'ZAR', 'KES'];
    if (highRiskCurrencies.includes(tx.currency?.toUpperCase())) riskScore += 1;
    
    // Determine risk level
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
}

// Helper function to normalize status
function normalizeStatus(status: string): TransactionStatus {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'success' || statusLower === 'successful') return 'success';
    if (statusLower === 'pending' || statusLower === 'processing') return 'processing';
    if (statusLower === 'failed' || statusLower === 'failure') return 'failed';
    return 'processing';
}

// Helper function to format relative time
function formatTimeAgo(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
    
    if (seconds < 0) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    
    return `${Math.floor(months / 12)}y ago`;
}

// Helper to extract country code from location or IP
function extractCountryCode(location: string, ip?: string): string {
    if (location && location.length === 2) return location.toUpperCase();
    if (location && location.length > 2) {
        // Try to extract from location string
        const match = location.match(/\b([A-Z]{2})\b/);
        if (match) return match[1];
    }
    // Default fallback
    return 'XX';
}

// Helper to detect device type (simplified)
function detectDevice(userAgent?: string, device?: string): DeviceType {
    if (device) {
        const deviceLower = device.toLowerCase();
        if (deviceLower.includes('mobile') || deviceLower.includes('phone')) return 'mobile';
        if (deviceLower.includes('desktop') || deviceLower.includes('pc')) return 'desktop';
    }
    if (userAgent) {
        const ua = userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad/.test(ua)) return 'mobile';
        if (/desktop|windows|mac|linux/.test(ua)) return 'desktop';
    }
    return 'unknown';
}

const statusConfig: Record<TransactionStatus, { icon: React.ReactNode; color: string; label: string }> = {
    success: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: 'bg-green-500/10 text-green-700 dark:text-green-400', label: 'Success' },
    completed: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: 'bg-green-500/10 text-green-700 dark:text-green-400', label: 'Completed' },
    processing: { icon: <Clock className="h-4 w-4 text-amber-500" />, color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', label: 'Processing' },
    pending: { icon: <Clock className="h-4 w-4 text-amber-500" />, color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', label: 'Pending' },
    failed: { icon: <AlertCircle className="h-4 w-4 text-red-500" />, color: 'bg-red-500/10 text-red-700 dark:text-red-400', label: 'Failed' },
};

const riskConfig: Record<RiskLevel, { color: string; label: string }> = {
    low: { color: 'bg-green-500/20 text-green-800 dark:text-green-300', label: 'Low' },
    medium: { color: 'bg-amber-500/20 text-amber-800 dark:text-amber-300', label: 'Medium' },
    high: { color: 'bg-red-500/20 text-red-800 dark:text-red-300', label: 'High' },
};

type SortField = 'timestamp' | 'amount' | 'status' | 'risk' | 'email';
type SortDirection = 'asc' | 'desc';

export default function RealTimePage() {
    const [transactions, setTransactions] = useState<RealTimeTransaction[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [riskFilter, setRiskFilter] = useState<string>('all');
    const [currencyFilter, setCurrencyFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
    const [amountRange, setAmountRange] = useState<{ min?: number; max?: number }>({});
    const [sortField, setSortField] = useState<SortField>('timestamp');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLive, setIsLive] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [flaggedTransactions, setFlaggedTransactions] = useState<Set<string>>(new Set());

    // Fetch transactions from API
    const fetchTransactions = useCallback(async () => {
        try {
            setError(null);
            const response = await fetch('/api/admin/dashboard/transactions?limit=50');
            
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            
            const data = await response.json();
            const fetchedTransactions = (data.transactions || []).map((tx: any) => {
                const status = normalizeStatus(tx.status || 'processing');
                const risk = calculateRiskScore(tx);
                const location = extractCountryCode(tx.location || '', tx.ip);
                const device = detectDevice(tx.userAgent, tx.device);
                
                return {
                    id: tx.id,
                    userId: tx.userId,
                    user: tx.customer || 'Unknown',
                    email: tx.email || 'No email',
                    amount: parseFloat(tx.amount || 0),
                    currency: (tx.currency || 'USD').toUpperCase(),
                    status,
                    risk,
                    location,
                    ip: tx.ip || 'N/A',
                    device,
                    timestamp: new Date(tx.date || Date.now()),
                    type: tx.type || 'transfer',
                    description: tx.description || '',
                } as RealTimeTransaction;
            });
            
            // Sort by timestamp (newest first)
            fetchedTransactions.sort((a: RealTimeTransaction, b: RealTimeTransaction) => 
                b.timestamp.getTime() - a.timestamp.getTime()
            );
            
            setTransactions(fetchedTransactions);
            setLastUpdate(new Date());
        } catch (err: any) {
            console.error('Error fetching transactions:', err);
            setError(err.message || 'Failed to load transactions');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch and set up polling
    useEffect(() => {
        fetchTransactions();
        
        // Poll every 5 seconds for real-time updates
        const interval = setInterval(() => {
            if (isLive) {
                fetchTransactions();
            }
        }, 5000);
        
        return () => clearInterval(interval);
    }, [fetchTransactions, isLive]);

    // Get unique currencies for filter
    const currencies = useMemo(() => {
        const unique = new Set(transactions.map(tx => tx.currency));
        return Array.from(unique).sort();
    }, [transactions]);

    // Calculate real-time stats
    const stats = useMemo(() => {
        const total = transactions.length;
        const successful = transactions.filter(tx => tx.status === 'success' || tx.status === 'completed').length;
        const failed = transactions.filter(tx => tx.status === 'failed').length;
        const processing = transactions.filter(tx => tx.status === 'processing' || tx.status === 'pending').length;
        const highRisk = transactions.filter(tx => tx.risk === 'high').length;
        const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : '0';

        return {
            total,
            successful,
            failed,
            processing,
            highRisk,
            totalAmount,
            successRate
        };
    }, [transactions]);

    // Filter and sort transactions
    const filteredTransactions = useMemo(() => {
        let filtered = transactions.filter(tx => {
            // Search filter
            const matchesSearch = !searchTerm || 
                tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.ip.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Status filter
            const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
            
            // Risk filter
            const matchesRisk = riskFilter === 'all' || tx.risk === riskFilter;
            
            // Currency filter
            const matchesCurrency = currencyFilter === 'all' || tx.currency === currencyFilter;
            
            // Date range filter
            const matchesDate = (!dateRange.from || tx.timestamp >= dateRange.from) &&
                               (!dateRange.to || tx.timestamp <= dateRange.to);
            
            // Amount range filter
            const matchesAmount = (!amountRange.min || tx.amount >= amountRange.min) &&
                                (!amountRange.max || tx.amount <= amountRange.max);
            
            return matchesSearch && matchesStatus && matchesRisk && matchesCurrency && matchesDate && matchesAmount;
        });

        // Sort transactions
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (sortField) {
                case 'timestamp':
                    aValue = a.timestamp.getTime();
                    bValue = b.timestamp.getTime();
                    break;
                case 'amount':
                    aValue = a.amount;
                    bValue = b.amount;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'risk':
                    const riskOrder = { high: 3, medium: 2, low: 1 };
                    aValue = riskOrder[a.risk];
                    bValue = riskOrder[b.risk];
                    break;
                case 'email':
                    aValue = a.email.toLowerCase();
                    bValue = b.email.toLowerCase();
                    break;
                default:
                    return 0;
            }
            
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [transactions, searchTerm, statusFilter, riskFilter, currencyFilter, dateRange, amountRange, sortField, sortDirection]);

    // Export to CSV
    const exportToCSV = useCallback(() => {
        const headers = ['ID', 'User', 'Email', 'Amount', 'Currency', 'Status', 'Risk', 'Location', 'IP', 'Device', 'Timestamp'];
        const rows = filteredTransactions.map(tx => [
            tx.id,
            tx.user,
            tx.email,
            tx.amount.toString(),
            tx.currency,
            tx.status,
            tx.risk,
            tx.location,
            tx.ip,
            tx.device,
            tx.timestamp.toISOString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `transactions_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [filteredTransactions]);

    // Handle column sorting
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    // Get sort icon
    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
        return sortDirection === 'asc' ? 
            <ArrowUp className="h-3 w-3 ml-1" /> : 
            <ArrowDown className="h-3 w-3 ml-1" />;
    };

    // Flag transaction
    const handleFlagTransaction = (txId: string) => {
        setFlaggedTransactions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(txId)) {
                newSet.delete(txId);
            } else {
                newSet.add(txId);
            }
            return newSet;
        });
    };

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold tracking-tight">Real-Time Transactions</h2>
                        {isLive && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="relative">
                                    <Radio className="h-4 w-4 text-green-500 animate-pulse" />
                                    <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                                </div>
                                <span>Live</span>
                            </div>
                        )}
                    </div>
                    <p className="text-muted-foreground">A live feed of all transactions happening on your platform.</p>
                    {lastUpdate && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Last updated: {formatTimeAgo(lastUpdate)}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        disabled={filteredTransactions.length === 0}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsLive(!isLive)}
                    >
                        {isLive ? 'Pause' : 'Resume'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchTransactions}
                        disabled={loading}
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Real-Time Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            {filteredTransactions.length} filtered
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.successRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.successful} successful, {stats.failed} failed
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                notation: 'compact',
                                maximumFractionDigits: 1
                            }).format(stats.totalAmount)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Across all currencies
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.highRisk}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? ((stats.highRisk / stats.total) * 100).toFixed(1) : 0}% of total
                        </p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Live Feed</CardTitle>
                        <div className="flex flex-col gap-3 w-full">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search by ID, email, IP..." 
                                        className="pl-10" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="success">Success</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={riskFilter} onValueChange={setRiskFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Risk" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Risk</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Currencies</SelectItem>
                                        {currencies.map(curr => (
                                            <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                                        {format(dateRange.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Date Range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange.from}
                                            selected={{
                                                from: dateRange.from,
                                                to: dateRange.to
                                            }}
                                            onSelect={(range) => setDateRange({
                                                from: range?.from,
                                                to: range?.to
                                            })}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                                {(statusFilter !== 'all' || riskFilter !== 'all' || currencyFilter !== 'all' || searchTerm || dateRange.from || amountRange.min || amountRange.max) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setStatusFilter('all');
                                            setRiskFilter('all');
                                            setCurrencyFilter('all');
                                            setSearchTerm('');
                                            setDateRange({});
                                            setAmountRange({});
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2 items-center">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">Amount:</span>
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        className="w-24 h-8"
                                        value={amountRange.min || ''}
                                        onChange={(e) => setAmountRange(prev => ({
                                            ...prev,
                                            min: e.target.value ? parseFloat(e.target.value) : undefined
                                        }))}
                                    />
                                    <span className="text-muted-foreground">-</span>
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        className="w-24 h-8"
                                        value={amountRange.max || ''}
                                        onChange={(e) => setAmountRange(prev => ({
                                            ...prev,
                                            max: e.target.value ? parseFloat(e.target.value) : undefined
                                        }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading && transactions.length === 0 ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center p-8">
                            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                            <p className="text-destructive font-medium mb-2">Error loading transactions</p>
                            <p className="text-sm text-muted-foreground mb-4">{error}</p>
                            <Button onClick={fetchTransactions} variant="outline">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => handleSort('status')}
                                            >
                                                Status
                                                {getSortIcon('status')}
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => handleSort('email')}
                                            >
                                                Transaction
                                                {getSortIcon('email')}
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => handleSort('amount')}
                                            >
                                                Amount
                                                {getSortIcon('amount')}
                                            </Button>
                                        </TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => handleSort('risk')}
                                            >
                                                Risk Score
                                                {getSortIcon('risk')}
                                            </Button>
                                        </TableHead>
                                        <TableHead className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => handleSort('timestamp')}
                                            >
                                                Time
                                                {getSortIcon('timestamp')}
                                            </Button>
                                        </TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence initial={false}>
                                        {filteredTransactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center p-8 text-muted-foreground">
                                                    <p>No transactions found.</p>
                                                    {searchTerm || statusFilter !== 'all' || riskFilter !== 'all' || currencyFilter !== 'all' || dateRange.from || amountRange.min || amountRange.max ? (
                                                        <p className="text-xs mt-2">Try adjusting your filters.</p>
                                                    ) : (
                                                        <p className="text-xs mt-2">Transactions will appear here as they occur.</p>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredTransactions.map((tx) => (
                                                <motion.tr
                                                    key={tx.id}
                                                    layout
                                                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, x: -50 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="text-sm hover:bg-muted/50"
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {statusConfig[tx.status]?.icon || statusConfig.processing.icon}
                                                            <span className="hidden md:inline">
                                                                {statusConfig[tx.status]?.label || tx.status}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium flex items-center gap-2">
                                                            {tx.id}
                                                            {flaggedTransactions.has(tx.id) && (
                                                                <Flag className="h-3 w-3 text-red-500" />
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{tx.email}</div>
                                                        {tx.user && (
                                                            <div className="text-xs text-muted-foreground">{tx.user}</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-mono">
                                                            {new Intl.NumberFormat('en-US', { 
                                                                style: 'currency', 
                                                                currency: tx.currency 
                                                            }).format(tx.amount)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{tx.currency}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-4 w-6 rounded-sm bg-muted flex items-center justify-center text-[10px] font-medium">
                                                                {tx.location}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground hidden sm:inline">{tx.ip}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge className={cn("capitalize text-xs", riskConfig[tx.risk].color)}>
                                                                {riskConfig[tx.risk].label}
                                                            </Badge>
                                                            {tx.device !== 'unknown' && (
                                                                tx.device === 'desktop' ? 
                                                                    <Monitor className="h-3.5 w-3.5 text-muted-foreground" /> : 
                                                                    <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="text-xs text-muted-foreground">
                                                            {formatTimeAgo(tx.timestamp)}
                                                        </div>
                                                        {tx.userId && (
                                                            <Link 
                                                                href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/transactions/${tx.id}`}
                                                                className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                                                            >
                                                                Details
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Link>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                {tx.userId && (
                                                                    <DropdownMenuItem asChild>
                                                                        <Link 
                                                                            href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/transactions/${tx.id}`}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <FileText className="mr-2 h-4 w-4" />
                                                                            View Details
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem
                                                                    onClick={() => handleFlagTransaction(tx.id)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Flag className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        flaggedTransactions.has(tx.id) && "text-red-500"
                                                                    )} />
                                                                    {flaggedTransactions.has(tx.id) ? 'Unflag' : 'Flag Transaction'}
                                                                </DropdownMenuItem>
                                                                {tx.risk === 'high' && (
                                                                    <DropdownMenuItem className="cursor-pointer text-red-600">
                                                                        <Shield className="mr-2 h-4 w-4" />
                                                                        Review Risk
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </motion.tr>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                            {filteredTransactions.length > 0 && (
                                <div className="mt-4 text-xs text-muted-foreground text-center">
                                    Showing {filteredTransactions.length} of {transactions.length} transactions
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
