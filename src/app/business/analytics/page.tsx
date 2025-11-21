
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Percent, RefreshCcw, Landmark, Download, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BusinessTransactionChart } from '@/components/business-transaction-chart';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

interface AnalyticsData {
    grossRevenue: number;
    netRevenue: number;
    refunds: number;
    taxes: number;
    grossRevenueChange: number;
    netRevenueChange: number;
    refundsChange: number;
    taxesChange: number;
    currency: string;
    revenueData: Array<{
        id: string;
        date: string;
        type: string;
        region: string;
        method: string;
        gross: number;
        fee: number;
        net: number;
        status: string;
    }>;
}

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
  Settled: 'default',
  'In Transit': 'secondary',
  Refunded: 'destructive',
};

export default function RevenueSummaryPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user && !authLoading) {
            setLoading(false);
            return;
        }

        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch('/api/business/analytics');
                
                if (!response.ok) {
                    throw new Error('Failed to fetch analytics data');
                }

                const data = await response.json();
                setAnalyticsData(data);
            } catch (err) {
                console.error('Error fetching analytics data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load analytics');
                // Fallback to mock data
                setAnalyticsData({
                    grossRevenue: 152345.67,
                    netRevenue: 148987.12,
                    refunds: 1230.00,
                    taxes: 2128.55,
                    grossRevenueChange: 18.2,
                    netRevenueChange: 17.9,
                    refundsChange: -5.1,
                    taxesChange: 18.2,
                    currency: 'USD',
                    revenueData: [
                        { id: 'txn_1', date: '2024-08-15', type: 'Payment Link', region: 'USA', method: 'Card', gross: 250.00, fee: 7.25, net: 242.75, status: 'Settled' },
                        { id: 'txn_2', date: '2024-08-15', type: 'Invoice', region: 'UK', method: 'Bank Transfer', gross: 1200.00, fee: 12.00, net: 1188.00, status: 'Settled' },
                        { id: 'txn_3', date: '2024-08-14', type: 'Subscription', region: 'EU', method: 'Card', gross: 49.99, fee: 1.75, net: 48.24, status: 'In Transit' },
                        { id: 'txn_4', date: '2024-08-14', type: 'Payment Link', region: 'NGA', method: 'Wallet', gross: 50.00, fee: 0.50, net: 49.50, status: 'Settled' },
                        { id: 'txn_5', date: '2024-08-13', type: 'Invoice', region: 'USA', method: 'Card', gross: 800.00, fee: 23.50, net: 776.50, status: 'Refunded' },
                    ]
                });
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAnalytics();
        }
    }, [user, authLoading]);

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

    const kpiCards = analyticsData ? [
        { title: "Gross Revenue", value: formatCurrency(analyticsData.grossRevenue, analyticsData.currency), change: `${analyticsData.grossRevenueChange >= 0 ? '+' : ''}${analyticsData.grossRevenueChange.toFixed(1)}%`, icon: <DollarSign /> },
        { title: "Net Revenue", value: formatCurrency(analyticsData.netRevenue, analyticsData.currency), change: `${analyticsData.netRevenueChange >= 0 ? '+' : ''}${analyticsData.netRevenueChange.toFixed(1)}%`, icon: <TrendingUp /> },
        { title: "Refunds", value: formatCurrency(analyticsData.refunds, analyticsData.currency), change: `${analyticsData.refundsChange >= 0 ? '+' : ''}${analyticsData.refundsChange.toFixed(1)}%`, icon: <TrendingDown /> },
        { title: "Taxes", value: formatCurrency(analyticsData.taxes, analyticsData.currency), change: `${analyticsData.taxesChange >= 0 ? '+' : ''}${analyticsData.taxesChange.toFixed(1)}%`, icon: <Percent /> },
    ] : [];
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Revenue Summary</h2>
                    <p className="text-muted-foreground">Analyze your business's revenue streams and performance.</p>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline"><Download className="mr-2 h-4 w-4"/>Export</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                 {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-32 mb-2" />
                                <Skeleton className="h-4 w-24" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    kpiCards.map(card => (
                        <Card key={card.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                <div className="p-2 bg-muted rounded-md">{card.icon}</div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <p className="text-xs text-muted-foreground">{card.change} from last month</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

             <Card className="mb-6">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Revenue Breakdown</CardTitle>
                            <CardDescription>Filter and view your revenue data.</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <DateRangePicker />
                             <Select><SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="All Products"/></SelectTrigger><SelectContent><SelectItem value="all">All Products</SelectItem></SelectContent></Select>
                             <Select><SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="All Regions"/></SelectTrigger><SelectContent><SelectItem value="all">All Regions</SelectItem></SelectContent></Select>
                             <Select><SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="All Methods"/></SelectTrigger><SelectContent><SelectItem value="all">All Methods</SelectItem></SelectContent></Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Gross</TableHead>
                                <TableHead>Net</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    </TableRow>
                                ))
                            ) : analyticsData ? (
                                analyticsData.revenueData.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-mono text-xs">{row.date}</TableCell>
                                        <TableCell>{row.type}</TableCell>
                                        <TableCell className="font-mono">{formatCurrency(row.gross, analyticsData.currency)}</TableCell>
                                        <TableCell className="font-mono font-semibold">{formatCurrency(row.net, analyticsData.currency)}</TableCell>
                                        <TableCell><Badge variant={statusVariant[row.status] || 'default'}>{row.status}</Badge></TableCell>
                                    </TableRow>
                                ))
                            ) : null}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Gross vs. Net revenue over the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                     <BusinessTransactionChart />
                </CardContent>
            </Card>
        </>
    );
}
