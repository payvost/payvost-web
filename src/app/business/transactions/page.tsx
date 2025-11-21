'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Search, Download, Filter, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

const statusConfig: Record<string, { icon: React.ReactNode; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Completed: { icon: <CheckCircle className="h-3 w-3 mr-1" />, color: 'text-green-600', variant: 'default' },
    Pending: { icon: <Clock className="h-3 w-3 mr-1" />, color: 'text-yellow-600', variant: 'secondary' },
    Failed: { icon: <XCircle className="h-3 w-3 mr-1" />, color: 'text-red-600', variant: 'destructive' },
    Overdue: { icon: <AlertTriangle className="h-3 w-3 mr-1" />, color: 'text-orange-600', variant: 'destructive' },
};

export default function BusinessTransactionsPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    useEffect(() => {
        if (!user && !authLoading) {
            setLoading(false);
            return;
        }

        const fetchTransactions = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (statusFilter !== 'all') params.append('status', statusFilter);
                if (typeFilter !== 'all') params.append('type', typeFilter);
                if (searchQuery) params.append('search', searchQuery);

                const response = await fetch(`/api/business/transactions?${params.toString()}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch transactions');
                }

                const data = await response.json();
                setTransactions(data.transactions || []);
            } catch (err) {
                console.error('Error fetching transactions:', err);
                // Fallback to empty array
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchTransactions();
        }
    }, [user, authLoading, statusFilter, typeFilter, searchQuery]);

    const filteredTransactions = transactions.filter(tx => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                tx.description?.toLowerCase().includes(query) ||
                tx.id?.toLowerCase().includes(query) ||
                tx.invoiceNumber?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
                    <p className="text-muted-foreground">View and manage all your business transactions.</p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle>All Transactions</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative flex-1 md:flex-initial">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search transactions..."
                                    className="pl-8 w-full md:w-[250px]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <DateRangePicker />
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Failed">Failed</SelectItem>
                                    <SelectItem value="Overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="Credit">Credit</SelectItem>
                                    <SelectItem value="Debit">Debit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No transactions found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((tx) => {
                                    const status = statusConfig[tx.status] || statusConfig.Pending;
                                    return (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-mono text-xs">
                                                {new Date(tx.date || tx.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="font-medium">{tx.description || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Badge variant={tx.type === 'Credit' ? 'default' : 'secondary'}>
                                                    {tx.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-sm" style={{ color: status.color }}>
                                                    {status.icon}
                                                    <span>{tx.status}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: tx.currency || 'USD',
                                                }).format(tx.amount || 0)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}

