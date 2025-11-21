
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Route, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Clock, 
    CheckCircle, 
    XCircle, 
    Settings, 
    RefreshCw,
    AlertTriangle,
    BarChart3,
    Zap,
    Globe,
    Search,
    Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import axios from 'axios';

interface ProviderPerformance {
    id: string;
    name: string;
    successRate: number;
    avgResponseTime: number;
    totalTransactions: number;
    totalVolume: number;
    costPerTransaction: number;
    status: 'active' | 'degraded' | 'down';
    supportedCurrencies: string[];
    supportedCountries: string[];
    lastUpdated: string;
}

interface RoutingRule {
    id: string;
    name: string;
    priority: number;
    conditions: {
        currency?: string[];
        amountMin?: number;
        amountMax?: number;
        sourceCountry?: string[];
        destinationCountry?: string[];
    };
    provider: string;
    enabled: boolean;
}

interface RoutingStats {
    totalOptimizations: number;
    costSavings: number;
    avgSuccessRate: number;
    avgResponseTime: number;
    topProvider: string;
    routingEfficiency: number;
}

export default function PaymentRoutingPage() {
    const [providers, setProviders] = useState<ProviderPerformance[]>([]);
    const [rules, setRules] = useState<RoutingRule[]>([]);
    const [stats, setStats] = useState<RoutingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const { toast } = useToast();

    const fetchRoutingData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/payment-routing');
            
            const providersData = response.data.providers || [];
            setProviders(providersData);
            setStats(response.data.stats || null);
            
            // Mock rules for now (should come from API in future)
            setRules([
                {
                    id: 'rule_1',
                    name: 'NGN Domestic Priority',
                    priority: 1,
                    conditions: {
                        currency: ['NGN'],
                        sourceCountry: ['NG'],
                        destinationCountry: ['NG'],
                    },
                    provider: 'paystack',
                    enabled: true,
                },
                {
                    id: 'rule_2',
                    name: 'High Value USD',
                    priority: 2,
                    conditions: {
                        currency: ['USD'],
                        amountMin: 10000,
                    },
                    provider: 'stripe',
                    enabled: true,
                },
                {
                    id: 'rule_3',
                    name: 'EUR SEPA Route',
                    priority: 3,
                    conditions: {
                        currency: ['EUR'],
                        sourceCountry: ['DE', 'FR', 'IT', 'ES'],
                    },
                    provider: 'stripe',
                    enabled: false,
                },
            ]);
        } catch (error: any) {
            console.error('Error fetching routing data:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to load routing data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutingData();
    }, []);

    const filteredProviders = providers.filter(p => 
        !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active': return 'default';
            case 'degraded': return 'secondary';
            case 'down': return 'destructive';
            default: return 'outline';
        }
    };

    const handleToggleRule = (ruleId: string) => {
        setRules(rules.map(rule => 
            rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
        ));
        toast({
            title: 'Rule updated',
            description: 'Routing rule status changed',
        });
    };

    const handleExport = () => {
        const csvContent = [
            ['Provider', 'Success Rate', 'Avg Response Time', 'Total Transactions', 'Total Volume', 'Cost Per Transaction', 'Status'].join(','),
            ...providers.map(p => [
                p.name,
                p.successRate,
                p.avgResponseTime,
                p.totalTransactions,
                p.totalVolume,
                p.costPerTransaction,
                p.status,
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-routing-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
            title: 'Export successful',
            description: 'Provider performance exported to CSV',
        });
    };

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Payment Routing & Optimization</h2>
                    <p className="text-muted-foreground">Monitor provider performance and optimize payment routing.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchRoutingData} disabled={loading}>
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Routing Efficiency</CardTitle>
                            <Zap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stats.routingEfficiency}%</div>
                                    <p className="text-xs text-muted-foreground">Optimal route selection</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cost Savings (30d)</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(stats.costSavings)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">From optimization</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stats.avgSuccessRate}%</div>
                                    <p className="text-xs text-muted-foreground">Across all providers</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
                                    <p className="text-xs text-muted-foreground">Transaction processing</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="providers">Provider Performance</TabsTrigger>
                    <TabsTrigger value="rules">Routing Rules</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
                            <Card><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Top Performing Providers</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {providers.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No provider data available</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {providers
                                                .sort((a, b) => b.successRate - a.successRate)
                                                .slice(0, 3)
                                                .map((provider, idx) => (
                                                    <div key={provider.id} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "h-2 w-2 rounded-full",
                                                                provider.status === 'active' ? "bg-green-500" :
                                                                provider.status === 'degraded' ? "bg-yellow-500" : "bg-red-500"
                                                            )} />
                                                            <span className="font-medium">{provider.name}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-medium">{provider.successRate}%</div>
                                                            <div className="text-xs text-muted-foreground">{provider.avgResponseTime}ms</div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Active Routing Rules</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {rules.filter(r => r.enabled).length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No active routing rules</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {rules.filter(r => r.enabled).map((rule) => (
                                                <div key={rule.id} className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">{rule.name}</div>
                                                        <div className="text-xs text-muted-foreground">Priority: {rule.priority}</div>
                                                    </div>
                                                    <Badge variant="default">{rule.provider}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="providers" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Provider Performance</CardTitle>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search providers..."
                                        className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-16 w-full" />
                                    ))}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Provider</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Success Rate</TableHead>
                                            <TableHead className="text-right">Avg Response</TableHead>
                                            <TableHead className="text-right">Transactions</TableHead>
                                            <TableHead className="text-right">Volume</TableHead>
                                            <TableHead className="text-right">Cost/Transaction</TableHead>
                                            <TableHead><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProviders.map((provider) => (
                                            <TableRow key={provider.id}>
                                                <TableCell>
                                                    <div className="font-medium">{provider.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {provider.supportedCurrencies.join(', ')}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(provider.status)}>
                                                        {provider.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {provider.successRate >= 97 ? (
                                                            <TrendingUp className="h-3 w-3 text-green-500" />
                                                        ) : (
                                                            <TrendingDown className="h-3 w-3 text-red-500" />
                                                        )}
                                                        <span className="font-medium">{provider.successRate}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    {provider.avgResponseTime}ms
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {new Intl.NumberFormat().format(provider.totalTransactions)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(provider.totalVolume)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    ${provider.costPerTransaction.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Settings className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                                            <DropdownMenuItem>Test Connection</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem>Configure</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rules" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Routing Rules</CardTitle>
                                <Button size="sm">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Create Rule
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {rules.map((rule) => (
                                    <Card key={rule.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h4 className="font-medium">{rule.name}</h4>
                                                        <Badge variant="outline">Priority {rule.priority}</Badge>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground space-y-1">
                                                        {rule.conditions.currency && (
                                                            <div>Currency: {rule.conditions.currency.join(', ')}</div>
                                                        )}
                                                        {rule.conditions.amountMin && (
                                                            <div>Amount: ${rule.conditions.amountMin.toLocaleString()}+</div>
                                                        )}
                                                        {rule.conditions.sourceCountry && (
                                                            <div>From: {rule.conditions.sourceCountry.join(', ')}</div>
                                                        )}
                                                        <div className="font-medium mt-2">→ Route to: {rule.provider}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Label htmlFor={`rule-${rule.id}`} className="text-xs">
                                                            {rule.enabled ? 'Enabled' : 'Disabled'}
                                                        </Label>
                                                        <Switch
                                                            id={`rule-${rule.id}`}
                                                            checked={rule.enabled}
                                                            onCheckedChange={() => handleToggleRule(rule.id)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="mt-4">
                    {loading || !stats ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
                            <Card><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Cost Optimization</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-2xl font-bold">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.costSavings)}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Saved in last 30 days</p>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500" style={{ width: '75%' }} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Routing Efficiency</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-2xl font-bold">{stats.routingEfficiency}%</div>
                                            <p className="text-xs text-muted-foreground">Optimal route selection rate</p>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${stats.routingEfficiency}%` }} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </>
    );
}

