
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  FileDown,
  ListFilter,
  MoreHorizontal,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  LineChart,
  DollarSign,
  Timer,
  Globe,
  TrendingUp,
  RefreshCw,
  Download,
  MapPin,
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
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface Remittance {
  id: string;
  from: string;
  to: string;
  fromAmount: number;
  toAmount: number;
  fxRate: string;
  partner: string;
  channel: string;
  status: 'Completed' | 'Processing' | 'Failed' | 'Delayed';
  deliveryTime: string;
  profit: number;
  fromCurrency: string;
  toCurrency: string;
}

type Status = 'Completed' | 'Processing' | 'Failed' | 'Delayed';
const statusConfig: Record<Status, { icon: React.ReactNode; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Completed: { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600', variant: 'default'},
    Processing: { icon: <Clock className="h-4 w-4" />, color: 'text-yellow-600', variant: 'secondary'},
    Failed: { icon: <XCircle className="h-4 w-4" />, color: 'text-red-600', variant: 'destructive'},
    Delayed: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-orange-600', variant: 'destructive'},
};

interface RemittanceStats {
  totalVolume24h: number;
  successfulPayouts24h: number;
  avgDeliveryTime: string;
  delayedCount: number;
  totalProfit: number;
  topCorridors: Array<{ corridor: string; volume: number; count: number }>;
  partnerPerformance: Array<{ partner: string; successRate: number; avgTime: string }>;
}

const countryFlags: Record<string, string> = {
  'USA': '🇺🇸', 'GBR': '🇬🇧', 'NGA': '🇳🇬', 'GHA': '🇬🇭', 'KEN': '🇰🇪', 'CAN': '🇨🇦',
  'EUR': '🇪🇺', 'AUD': '🇦🇺', 'ZAF': '🇿🇦', 'IND': '🇮🇳', 'CHN': '🇨🇳',
};

export default function AdminRemittancesPage() {
    const [remittances, setRemittances] = useState<Remittance[]>([]);
    const [stats, setStats] = useState<RemittanceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [filterPartner, setFilterPartner] = useState<string[]>([]);
    const [filterCorridor, setFilterCorridor] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
    const { toast } = useToast();

    useEffect(() => {
        const fetchRemittances = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (dateRange.from) params.append('startDate', dateRange.from.toISOString());
                if (dateRange.to) params.append('endDate', dateRange.to.toISOString());
                if (activeTab !== 'all') params.append('status', activeTab);

                const response = await axios.get(`/api/admin/remittances?${params}`);
                
                const remittancesData = response.data.remittances || [];
                setRemittances(remittancesData);
                setStats(response.data.stats || null);
            } catch (error: any) {
                console.error('Error fetching remittances:', error);
                toast({
                    title: 'Error',
                    description: error.response?.data?.error || 'Failed to load remittances',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchRemittances();
    }, [dateRange, activeTab, toast]);

    const filteredRemittances = remittances.filter(rem => {
        if (searchQuery && !rem.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterPartner.length > 0 && !filterPartner.includes(rem.partner)) return false;
        if (filterCorridor.length > 0 && !filterCorridor.includes(`${rem.from} → ${rem.to}`)) return false;
        return true;
    });

    const handleExport = () => {
        const csvContent = [
            ['ID', 'From', 'To', 'From Amount', 'To Amount', 'FX Rate', 'Partner', 'Channel', 'Status', 'Delivery Time', 'Profit'].join(','),
            ...filteredRemittances.map(rem => [
                rem.id,
                rem.from,
                rem.to,
                rem.fromAmount,
                rem.toAmount,
                rem.fxRate,
                rem.partner,
                rem.channel,
                rem.status,
                rem.deliveryTime,
                rem.profit,
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `remittances-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
            title: 'Export successful',
            description: 'Remittances exported to CSV',
        });
    };
    
    const renderRemittancesTable = (data: Remittance[]) => {
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
                    <p className="text-muted-foreground">No remittances found</p>
                </div>
            );
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Transaction</TableHead>
                        <TableHead>Corridor</TableHead>
                        <TableHead>Partner / Channel</TableHead>
                        <TableHead className="text-right">Amounts</TableHead>
                        <TableHead>FX Rate</TableHead>
                        <TableHead>Delivery Time</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((rem) => {
                        const status = statusConfig[rem.status];
                        return (
                            <TableRow key={rem.id}>
                                <TableCell>
                                    <div className="font-medium">{rem.id}</div>
                                    <div className={cn("flex items-center gap-1.5 text-xs", status.color)}>
                                        {status.icon}
                                        <span>{rem.status}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 font-medium">
                                        <span className="text-lg">{countryFlags[rem.from] || '🌍'}</span>
                                        <span className="text-xs">{rem.from}</span>
                                        <ArrowRight className="h-3 w-3 text-muted-foreground"/>
                                        <span className="text-lg">{countryFlags[rem.to] || '🌍'}</span>
                                        <span className="text-xs">{rem.to}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {rem.fromCurrency} → {rem.toCurrency}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{rem.partner}</div>
                                    <div className="text-xs text-muted-foreground">{rem.channel}</div>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    <div className="text-sm">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: rem.fromCurrency }).format(rem.fromAmount)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: rem.toCurrency }).format(rem.toAmount)}
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm">{rem.fxRate}</TableCell>
                                <TableCell>
                                    <Badge variant={rem.status === 'Delayed' ? 'destructive' : 'outline'}>
                                        {rem.deliveryTime}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm text-green-600">
                                    ${rem.profit.toFixed(2)}
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
                                        <DropdownMenuItem asChild>
                                            <Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/transactions/${rem.id}`}>
                                                View Details
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>Mark as Reviewed</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">Escalate Issue</DropdownMenuItem>
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
                    <h2 className="text-3xl font-bold tracking-tight">Cross-Border Transfers</h2>
                    <p className="text-muted-foreground">Monitor and manage all cross-border remittance transactions.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Volume (24h)</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(stats.totalVolume24h)}
                            </div>
                            <p className="text-xs text-muted-foreground">+5.2% vs yesterday</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Successful Payouts</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.successfulPayouts24h}</div>
                            <p className="text-xs text-muted-foreground">+120 vs yesterday</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Delivery Time</CardTitle>
                            <Timer className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.avgDeliveryTime}</div>
                            <p className="text-xs text-muted-foreground">-3 mins vs yesterday</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Delayed Transactions</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.delayedCount}</div>
                            <p className="text-xs text-muted-foreground">+2 vs yesterday</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Top Corridors & Partner Performance */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Top Corridors
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {stats.topCorridors.map((corridor, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{corridor.corridor}</div>
                                            <div className="text-xs text-muted-foreground">{corridor.count} transactions</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-sm">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(corridor.volume)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Partner Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {stats.partnerPerformance.map((partner, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{partner.partner}</div>
                                            <div className="text-xs text-muted-foreground">Avg: {partner.avgTime}</div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={partner.successRate >= 80 ? 'default' : partner.successRate >= 50 ? 'secondary' : 'destructive'}>
                                                {partner.successRate}%
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="all">All Remittances</TabsTrigger>
                        <TabsTrigger value="delayed">Delayed Queue</TabsTrigger>
                        <TabsTrigger value="processing">Processing</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search transaction ID..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 gap-1">
                                <ListFilter className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Filter by Partner</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {['Stripe', 'Wise', 'WorldRemit', 'Local Bank'].map(partner => (
                                    <DropdownMenuCheckboxItem 
                                        key={partner}
                                        checked={filterPartner.includes(partner)}
                                        onCheckedChange={(checked) => {
                                            setFilterPartner(checked 
                                                ? [...filterPartner, partner]
                                                : filterPartner.filter(p => p !== partner)
                                            );
                                        }}
                                    >
                                        {partner}
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
                    <CardContent className="p-0">
                        <TabsContent value="all">
                            {renderRemittancesTable(filteredRemittances)}
                        </TabsContent>
                        <TabsContent value="delayed">
                            {renderRemittancesTable(filteredRemittances.filter(r => r.status === 'Delayed'))}
                        </TabsContent>
                        <TabsContent value="processing">
                            {renderRemittancesTable(filteredRemittances.filter(r => r.status === 'Processing'))}
                        </TabsContent>
                    </CardContent>
                    <CardFooter>
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>1-{filteredRemittances.length}</strong> of <strong>{filteredRemittances.length}</strong> remittances
                        </div>
                    </CardFooter>
                </Card>
            </Tabs>
        </>
    )
}
