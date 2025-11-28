'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Search, Network, Globe, Building2, CheckCircle, AlertTriangle, TrendingUp, FileText, Clock, DollarSign, Activity, ListFilter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CorrespondentBank {
    id: string;
    name: string;
    country: string;
    region: string;
    swiftCode: string;
    relationshipType: 'Direct' | 'Nostro' | 'Vostro' | 'Correspondent';
    status: 'Active' | 'Pending' | 'Suspended' | 'Inactive';
    volume30d: number;
    transactionCount: number;
    successRate: number;
    avgSettlementTime: string;
    lastActivity: string;
    agreements: string[];
}

const sampleBanks: CorrespondentBank[] = [
    {
        id: 'bank_001',
        name: 'Deutsche Bank AG',
        country: 'Germany',
        region: 'Europe',
        swiftCode: 'DEUTDEFF',
        relationshipType: 'Direct',
        status: 'Active',
        volume30d: 24500000,
        transactionCount: 12450,
        successRate: 99.8,
        avgSettlementTime: '2-4 hours',
        lastActivity: '2024-08-15 14:30',
        agreements: ['SEPA', 'SWIFT', 'Direct Debit']
    },
    {
        id: 'bank_002',
        name: 'JPMorgan Chase Bank',
        country: 'United States',
        region: 'North America',
        swiftCode: 'CHASUS33',
        relationshipType: 'Nostro',
        status: 'Active',
        volume30d: 18900000,
        transactionCount: 8920,
        successRate: 99.5,
        avgSettlementTime: '1-3 hours',
        lastActivity: '2024-08-15 13:15',
        agreements: ['ACH', 'SWIFT', 'Fedwire']
    },
    {
        id: 'bank_003',
        name: 'Standard Chartered Bank',
        country: 'United Kingdom',
        region: 'Europe',
        swiftCode: 'SCBLGB2L',
        relationshipType: 'Correspondent',
        status: 'Active',
        volume30d: 15600000,
        transactionCount: 6780,
        successRate: 98.9,
        avgSettlementTime: '3-6 hours',
        lastActivity: '2024-08-15 12:45',
        agreements: ['SWIFT', 'FPS', 'CHAPS']
    },
    {
        id: 'bank_004',
        name: 'First Bank of Nigeria',
        country: 'Nigeria',
        region: 'Africa',
        swiftCode: 'FBNINGLA',
        relationshipType: 'Vostro',
        status: 'Active',
        volume30d: 8900000,
        transactionCount: 4560,
        successRate: 97.2,
        avgSettlementTime: '4-8 hours',
        lastActivity: '2024-08-15 11:20',
        agreements: ['NIP', 'SWIFT', 'RTGS']
    },
    {
        id: 'bank_005',
        name: 'Bank of China',
        country: 'China',
        region: 'Asia',
        swiftCode: 'BKCHCNBJ',
        relationshipType: 'Correspondent',
        status: 'Pending',
        volume30d: 0,
        transactionCount: 0,
        successRate: 0,
        avgSettlementTime: 'N/A',
        lastActivity: '2024-08-10 09:00',
        agreements: ['CNAPS', 'SWIFT']
    },
];

const statusConfig: Record<CorrespondentBank['status'], { className: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Active: { className: 'bg-green-500/20 text-green-700 border-green-500/30', variant: 'default' },
    Pending: { className: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30', variant: 'secondary' },
    Suspended: { className: 'bg-red-500/20 text-red-700 border-red-500/30', variant: 'destructive' },
    Inactive: { className: 'bg-gray-500/20 text-gray-700 border-gray-500/30', variant: 'outline' },
};

const relationshipConfig: Record<CorrespondentBank['relationshipType'], { className: string }> = {
    Direct: { className: 'bg-blue-500/20 text-blue-700 border-blue-500/30' },
    Nostro: { className: 'bg-purple-500/20 text-purple-700 border-purple-500/30' },
    Vostro: { className: 'bg-indigo-500/20 text-indigo-700 border-indigo-500/30' },
    Correspondent: { className: 'bg-teal-500/20 text-teal-700 border-teal-500/30' },
};

export default function CorrespondentBankingPage() {
    const router = useRouter();

    const totalVolume = sampleBanks.reduce((sum, bank) => sum + bank.volume30d, 0);
    const totalTransactions = sampleBanks.reduce((sum, bank) => sum + bank.transactionCount, 0);
    const avgSuccessRate = sampleBanks
        .filter(bank => bank.status === 'Active')
        .reduce((sum, bank, _, arr) => sum + (bank.successRate / arr.length), 0);
    const activeBanks = sampleBanks.filter(bank => bank.status === 'Active').length;

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Correspondent Banking</h2>
                    <p className="text-muted-foreground">Manage correspondent bank relationships and monitor cross-border banking operations.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline"><FileText className="mr-2 h-4 w-4"/>View Agreements</Button>
                    <Button><PlusCircle className="mr-2 h-4 w-4"/>Add Bank</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Relationships</CardTitle>
                        <Network className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeBanks}</div>
                        <p className="text-xs text-muted-foreground">Out of {sampleBanks.length} total banks</p>
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
                        <p className="text-xs text-muted-foreground">+12.5% from last month</p>
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
                        <p className="text-xs text-muted-foreground">Across all relationships</p>
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

            <Tabs defaultValue="banks">
                <TabsList>
                    <TabsTrigger value="banks">Correspondent Banks</TabsTrigger>
                    <TabsTrigger value="agreements">Agreements</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="banks" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search by bank name, SWIFT code, or country..."
                                        className="w-full rounded-lg bg-background pl-8"
                                    />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-10 gap-1">
                                            <ListFilter className="h-3.5 w-3.5" />
                                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuCheckboxItem>Active</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>Pending</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>Suspended</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>Inactive</DropdownMenuCheckboxItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Filter by Region</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuCheckboxItem>Europe</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>North America</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>Asia</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>Africa</DropdownMenuCheckboxItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bank</TableHead>
                                        <TableHead>Relationship</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Volume (30d)</TableHead>
                                        <TableHead>Success Rate</TableHead>
                                        <TableHead>Settlement Time</TableHead>
                                        <TableHead>Last Activity</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sampleBanks.map((bank) => {
                                        const status = statusConfig[bank.status];
                                        const relationship = relationshipConfig[bank.relationshipType];
                                        return (
                                            <TableRow key={bank.id} className="cursor-pointer" onClick={() => router.push(`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/correspondent-banking/${bank.id}`)}>
                                                <TableCell>
                                                    <div className="font-medium">{bank.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {bank.country} • {bank.swiftCode}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {bank.region}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(relationship.className)}>
                                                        {bank.relationshipType}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={status.variant} className={cn(status.className)}>
                                                        {bank.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {bank.status === 'Active' ? (
                                                        <div className="font-mono text-sm">
                                                            ${(bank.volume30d / 1000000).toFixed(2)}M
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {bank.status === 'Active' ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-mono text-sm">{bank.successRate}%</div>
                                                            <Badge 
                                                                variant={bank.successRate >= 99 ? 'default' : bank.successRate >= 97 ? 'secondary' : 'destructive'}
                                                                className="text-xs"
                                                            >
                                                                {bank.successRate >= 99 ? 'Excellent' : bank.successRate >= 97 ? 'Good' : 'Needs Review'}
                                                            </Badge>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {bank.status === 'Active' ? (
                                                        <Badge variant="outline">{bank.avgSettlementTime}</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {bank.lastActivity}
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
                                                            <DropdownMenuItem>Edit Relationship</DropdownMenuItem>
                                                            <DropdownMenuItem>View Agreements</DropdownMenuItem>
                                                            <DropdownMenuItem>Performance Report</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem>Suspend Relationship</DropdownMenuItem>
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

                <TabsContent value="agreements" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Banking Agreements</CardTitle>
                            <CardDescription>Manage and monitor agreements with correspondent banks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {sampleBanks.filter(bank => bank.status === 'Active').map((bank) => (
                                    <div key={bank.id} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h4 className="font-medium">{bank.name}</h4>
                                                <p className="text-sm text-muted-foreground">{bank.swiftCode}</p>
                                            </div>
                                            <Badge variant="outline">Active</Badge>
                                        </div>
                                        <div className="mt-3">
                                            <p className="text-sm font-medium mb-2">Supported Agreements:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {bank.agreements.map((agreement) => (
                                                    <Badge key={agreement} variant="secondary">{agreement}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performing Banks</CardTitle>
                                <CardDescription>By transaction volume (30 days)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {sampleBanks
                                        .filter(bank => bank.status === 'Active')
                                        .sort((a, b) => b.volume30d - a.volume30d)
                                        .slice(0, 5)
                                        .map((bank, idx) => (
                                            <div key={bank.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{bank.name}</div>
                                                        <div className="text-xs text-muted-foreground">{bank.country}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono text-sm">${(bank.volume30d / 1000000).toFixed(2)}M</div>
                                                    <div className="text-xs text-muted-foreground">{bank.transactionCount.toLocaleString()} txn</div>
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
                                    {sampleBanks
                                        .filter(bank => bank.status === 'Active')
                                        .sort((a, b) => b.successRate - a.successRate)
                                        .slice(0, 5)
                                        .map((bank, idx) => (
                                            <div key={bank.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{bank.name}</div>
                                                        <div className="text-xs text-muted-foreground">{bank.region}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono text-sm font-bold">{bank.successRate}%</div>
                                                    <div className="text-xs text-muted-foreground">{bank.avgSettlementTime}</div>
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

