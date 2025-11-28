'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Search, Puzzle, CheckCircle, Shield, Activity, TrendingUp, AlertTriangle, Settings, KeyRound, RefreshCw, ListFilter, Globe, DollarSign, Clock, Eye, EyeOff, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface PaymentProvider {
    id: string;
    name: string;
    type: 'Card Processor' | 'Digital Wallet' | 'Bank Transfer' | 'Alternative Payment';
    region: string;
    status: 'Active' | 'Inactive' | 'Pending' | 'Issues Detected';
    enabled: boolean;
    capabilities: string[];
    successRate: number;
    avgResponseTime: string;
    volume30d: number;
    transactionCount: number;
    lastValidated: string;
    apiKeyVisible: boolean;
}

const sampleProviders: PaymentProvider[] = [
    {
        id: 'provider_001',
        name: 'Stripe',
        type: 'Card Processor',
        region: 'Global',
        status: 'Active',
        enabled: true,
        capabilities: ['Credit Cards', 'Debit Cards', '3D Secure', 'Recurring Payments', 'Apple Pay', 'Google Pay'],
        successRate: 99.8,
        avgResponseTime: '120ms',
        volume30d: 45000000,
        transactionCount: 125000,
        lastValidated: '2024-08-15 10:30',
        apiKeyVisible: false
    },
    {
        id: 'provider_002',
        name: 'PayPal',
        type: 'Digital Wallet',
        region: 'Global',
        status: 'Active',
        enabled: true,
        capabilities: ['PayPal Wallet', 'Credit Cards', 'Bank Transfers', 'Buy Now Pay Later'],
        successRate: 99.2,
        avgResponseTime: '180ms',
        volume30d: 32000000,
        transactionCount: 98000,
        lastValidated: '2024-08-15 09:15',
        apiKeyVisible: false
    },
    {
        id: 'provider_003',
        name: 'Paystack',
        type: 'Card Processor',
        region: 'Africa',
        status: 'Active',
        enabled: true,
        capabilities: ['Credit Cards', 'Debit Cards', 'Bank Transfers', 'Mobile Money', 'USSD'],
        successRate: 98.5,
        avgResponseTime: '150ms',
        volume30d: 18500000,
        transactionCount: 67000,
        lastValidated: '2024-08-15 11:00',
        apiKeyVisible: false
    },
    {
        id: 'provider_004',
        name: 'Square',
        type: 'Card Processor',
        region: 'North America',
        status: 'Active',
        enabled: true,
        capabilities: ['Credit Cards', 'Debit Cards', 'Contactless Payments', 'Invoicing'],
        successRate: 99.5,
        avgResponseTime: '110ms',
        volume30d: 12000000,
        transactionCount: 45000,
        lastValidated: '2024-08-14 16:20',
        apiKeyVisible: false
    },
    {
        id: 'provider_005',
        name: 'Adyen',
        type: 'Card Processor',
        region: 'Global',
        status: 'Active',
        enabled: true,
        capabilities: ['Credit Cards', 'Debit Cards', 'Digital Wallets', 'Bank Transfers', 'Local Payment Methods'],
        successRate: 99.7,
        avgResponseTime: '95ms',
        volume30d: 28000000,
        transactionCount: 89000,
        lastValidated: '2024-08-15 08:45',
        apiKeyVisible: false
    },
    {
        id: 'provider_006',
        name: 'Razorpay',
        type: 'Card Processor',
        region: 'India',
        status: 'Issues Detected',
        enabled: true,
        capabilities: ['Credit Cards', 'Debit Cards', 'UPI', 'Net Banking', 'Wallets'],
        successRate: 94.2,
        avgResponseTime: '250ms',
        volume30d: 8500000,
        transactionCount: 32000,
        lastValidated: '2024-08-12 14:30',
        apiKeyVisible: false
    },
    {
        id: 'provider_007',
        name: 'Flutterwave',
        type: 'Card Processor',
        region: 'Africa',
        status: 'Active',
        enabled: true,
        capabilities: ['Credit Cards', 'Debit Cards', 'Bank Transfers', 'Mobile Money', 'M-Pesa'],
        successRate: 97.8,
        avgResponseTime: '200ms',
        volume30d: 15000000,
        transactionCount: 56000,
        lastValidated: '2024-08-15 07:30',
        apiKeyVisible: false
    },
    {
        id: 'provider_008',
        name: 'Mercado Pago',
        type: 'Alternative Payment',
        region: 'Latin America',
        status: 'Pending',
        enabled: false,
        capabilities: ['Credit Cards', 'Debit Cards', 'Bank Transfers', 'Cash Payments'],
        successRate: 0,
        avgResponseTime: 'N/A',
        volume30d: 0,
        transactionCount: 0,
        lastValidated: '2024-08-10 12:00',
        apiKeyVisible: false
    },
];

const statusConfig: Record<PaymentProvider['status'], { className: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Active: { className: 'bg-green-500/20 text-green-700 border-green-500/30', variant: 'default' },
    Inactive: { className: 'bg-gray-500/20 text-gray-700 border-gray-500/30', variant: 'outline' },
    Pending: { className: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30', variant: 'secondary' },
    'Issues Detected': { className: 'bg-red-500/20 text-red-700 border-red-500/30', variant: 'destructive' },
};

const typeConfig: Record<PaymentProvider['type'], { className: string }> = {
    'Card Processor': { className: 'bg-blue-500/20 text-blue-700 border-blue-500/30' },
    'Digital Wallet': { className: 'bg-purple-500/20 text-purple-700 border-purple-500/30' },
    'Bank Transfer': { className: 'bg-indigo-500/20 text-indigo-700 border-indigo-500/30' },
    'Alternative Payment': { className: 'bg-teal-500/20 text-teal-700 border-teal-500/30' },
};

export default function PaymentProviderManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [providers, setProviders] = useState(sampleProviders);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<string[]>([]);

    const handleValidate = (providerName: string) => {
        toast({
            title: `Validating ${providerName}...`,
            description: 'API credentials check initiated. Please wait a moment.',
        });
        setTimeout(() => {
            toast({
                title: `${providerName} Validated!`,
                description: 'The API connection was successful.',
            });
        }, 2000);
    };

    const handleToggleEnabled = (providerId: string) => {
        setProviders(providers.map(p => 
            p.id === providerId ? { ...p, enabled: !p.enabled } : p
        ));
    };

    const handleToggleApiKeyVisibility = (providerId: string) => {
        setProviders(providers.map(p => 
            p.id === providerId ? { ...p, apiKeyVisible: !p.apiKeyVisible } : p
        ));
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to Clipboard', description: `${label} has been copied.` });
    };

    const totalVolume = providers.filter(p => p.status === 'Active').reduce((sum, p) => sum + p.volume30d, 0);
    const totalTransactions = providers.filter(p => p.status === 'Active').reduce((sum, p) => sum + p.transactionCount, 0);
    const avgSuccessRate = providers
        .filter(p => p.status === 'Active')
        .reduce((sum, p, _, arr) => sum + (p.successRate / arr.length), 0);
    const activeProviders = providers.filter(p => p.status === 'Active').length;

    const filteredProviders = providers.filter(provider => {
        if (searchQuery && !provider.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !provider.region.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (filterStatus.length > 0 && !filterStatus.includes(provider.status)) return false;
        if (filterType.length > 0 && !filterType.includes(provider.type)) return false;
        return true;
    });

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Payment Provider Management</h2>
                    <p className="text-muted-foreground">Manage payment providers, configure settings, and monitor performance.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline"><Settings className="mr-2 h-4 w-4"/>Routing Rules</Button>
                    <Button><PlusCircle className="mr-2 h-4 w-4"/>Add Provider</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeProviders}</div>
                        <p className="text-xs text-muted-foreground">Out of {providers.length} total providers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Volume (30d)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${(totalVolume / 1000000).toFixed(1)}M
                        </div>
                        <p className="text-xs text-muted-foreground">+15.3% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions (30d)</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalTransactions.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Across all providers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Success Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Weighted average</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="providers">
                <TabsList>
                    <TabsTrigger value="providers">Payment Providers</TabsTrigger>
                    <TabsTrigger value="routing">Routing Rules</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="providers" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search by provider name or region..."
                                        className="w-full rounded-lg bg-background pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-10 gap-1">
                                            <ListFilter className="h-3.5 w-3.5" />
                                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {['Active', 'Inactive', 'Pending', 'Issues Detected'].map(status => (
                                            <DropdownMenuCheckboxItem
                                                key={status}
                                                checked={filterStatus.includes(status)}
                                                onCheckedChange={(checked) => {
                                                    setFilterStatus(checked
                                                        ? [...filterStatus, status]
                                                        : filterStatus.filter(s => s !== status)
                                                    );
                                                }}
                                            >
                                                {status}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {['Card Processor', 'Digital Wallet', 'Bank Transfer', 'Alternative Payment'].map(type => (
                                            <DropdownMenuCheckboxItem
                                                key={type}
                                                checked={filterType.includes(type)}
                                                onCheckedChange={(checked) => {
                                                    setFilterType(checked
                                                        ? [...filterType, type]
                                                        : filterType.filter(t => t !== type)
                                                    );
                                                }}
                                            >
                                                {type}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Provider</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Capabilities</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Success Rate</TableHead>
                                        <TableHead>Response Time</TableHead>
                                        <TableHead className="text-center">Enabled</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProviders.map((provider) => {
                                        const status = statusConfig[provider.status];
                                        const type = typeConfig[provider.type];
                                        return (
                                            <TableRow key={provider.id} className="cursor-pointer" onClick={() => router.push(`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/payment-provider-management/${provider.id}`)}>
                                                <TableCell>
                                                    <div className="font-medium">{provider.name}</div>
                                                    <div className="text-sm text-muted-foreground">{provider.region}</div>
                                                    {provider.status === 'Issues Detected' && (
                                                        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            Requires attention
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(type.className)}>
                                                        {provider.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {provider.capabilities.slice(0, 3).map(cap => (
                                                            <Badge key={cap} variant="secondary" className="text-xs">{cap}</Badge>
                                                        ))}
                                                        {provider.capabilities.length > 3 && (
                                                            <Badge variant="secondary" className="text-xs">+{provider.capabilities.length - 3}</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={status.variant} className={cn(status.className)}>
                                                        {provider.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {provider.status === 'Active' ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="font-mono text-sm">{provider.successRate}%</div>
                                                            <Badge
                                                                variant={provider.successRate >= 99 ? 'default' : provider.successRate >= 97 ? 'secondary' : 'destructive'}
                                                                className="text-xs"
                                                            >
                                                                {provider.successRate >= 99 ? 'Excellent' : provider.successRate >= 97 ? 'Good' : 'Poor'}
                                                            </Badge>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {provider.status === 'Active' ? (
                                                        <Badge variant="outline">{provider.avgResponseTime}</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={provider.enabled}
                                                        onCheckedChange={() => handleToggleEnabled(provider.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                aria-haspopup="true"
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Toggle menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                                            <DropdownMenuItem>Edit Configuration</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleValidate(provider.name)}>
                                                                Validate API
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>View API Keys</DropdownMenuItem>
                                                            <DropdownMenuItem>Performance Report</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive">
                                                                {provider.enabled ? 'Disable' : 'Enable'} Provider
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="routing" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Routing Rules</CardTitle>
                            <CardDescription>Configure how payments are routed to different providers based on criteria</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium">Primary Routing Rule</h4>
                                            <p className="text-sm text-muted-foreground">Route all card payments to Stripe by default</p>
                                        </div>
                                        <Badge variant="outline">Active</Badge>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Badge variant="secondary">Card Payments</Badge>
                                        <span className="text-muted-foreground">→</span>
                                        <Badge variant="default">Stripe</Badge>
                                    </div>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium">Regional Routing</h4>
                                            <p className="text-sm text-muted-foreground">Route African payments to Paystack</p>
                                        </div>
                                        <Badge variant="outline">Active</Badge>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Badge variant="secondary">Region: Africa</Badge>
                                        <span className="text-muted-foreground">→</span>
                                        <Badge variant="default">Paystack</Badge>
                                    </div>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium">Fallback Routing</h4>
                                            <p className="text-sm text-muted-foreground">Use PayPal as fallback if primary fails</p>
                                        </div>
                                        <Badge variant="outline">Active</Badge>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Badge variant="secondary">Primary Fails</Badge>
                                        <span className="text-muted-foreground">→</span>
                                        <Badge variant="default">PayPal</Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardContent className="pt-0">
                            <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Add Routing Rule</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performing Providers</CardTitle>
                                <CardDescription>By transaction volume (30 days)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {providers
                                        .filter(p => p.status === 'Active')
                                        .sort((a, b) => b.volume30d - a.volume30d)
                                        .slice(0, 5)
                                        .map((provider, idx) => (
                                            <div key={provider.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{provider.name}</div>
                                                        <div className="text-xs text-muted-foreground">{provider.region}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono text-sm">${(provider.volume30d / 1000000).toFixed(2)}M</div>
                                                    <div className="text-xs text-muted-foreground">{provider.transactionCount.toLocaleString()} txn</div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Success Rate Leaders</CardTitle>
                                <CardDescription>Highest success rates (30 days)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {providers
                                        .filter(p => p.status === 'Active')
                                        .sort((a, b) => b.successRate - a.successRate)
                                        .slice(0, 5)
                                        .map((provider, idx) => (
                                            <div key={provider.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{provider.name}</div>
                                                        <div className="text-xs text-muted-foreground">{provider.type}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono text-sm font-bold">{provider.successRate}%</div>
                                                    <div className="text-xs text-muted-foreground">{provider.avgResponseTime}</div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </>
    );
}

