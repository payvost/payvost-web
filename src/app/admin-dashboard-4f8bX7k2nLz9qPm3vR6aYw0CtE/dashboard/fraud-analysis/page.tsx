
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileDown, Search, ShieldAlert, BadgeInfo, BarChart, SlidersHorizontal, Check, X } from 'lucide-react';
import { AdminTransactionOverviewChart } from '@/components/admin-transaction-overview-chart'; // Reusing for visualization
import type { FraudCase } from '@/types/fraud-case';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const sampleCases: FraudCase[] = [
    { id: 'case_1', transactionId: 'txn_9i0j1k2l', reason: 'High-Risk Jurisdiction', riskScore: 85, status: 'Open', timestamp: '2024-08-14 11:30 UTC', user: { name: 'Isabella Nguyen', id: 'usr_3'} },
    { id: 'case_2', transactionId: 'txn_abc123', reason: 'Unusual Login Location', riskScore: 92, status: 'Open', timestamp: '2024-08-15 09:05 UTC', user: { name: 'William Kim', id: 'usr_4'} },
    { id: 'case_3', transactionId: 'txn_def456', reason: 'Velocity Check Failure', riskScore: 78, status: 'Resolved', timestamp: '2024-08-13 15:00 UTC', user: { name: 'Sofia Davis', id: 'usr_5'} },
];

const riskConfig: Record<string, { className: string }> = {
    High: { className: 'bg-red-600/20 text-red-800' },
    Medium: { className: 'bg-orange-500/20 text-orange-800' },
    Low: { className: 'bg-yellow-500/20 text-yellow-800' },
};

const getRiskLevel = (score: number): keyof typeof riskConfig => {
    if (score > 80) return 'High';
    if (score > 60) return 'Medium';
    return 'Low';
}

export default function FraudAnalysisPage() {
    const router = useRouter();

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Fraud & Risk Analysis</h2>
                    <p className="text-muted-foreground">Monitor and investigate potentially fraudulent activity.</p>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline"><SlidersHorizontal className="mr-2 h-4 w-4"/>Configure Rules</Button>
                    <Button><FileDown className="mr-2 h-4 w-4"/>Export Report</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Blocked Transactions (24h)</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">142</div>
                        <p className="text-xs text-muted-foreground">+12% from last 24h</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cases Pending Review</CardTitle>
                        <BadgeInfo className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">Requires manual intervention</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High-Risk Users</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-muted-foreground">Accounts under observation</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fraud Model Accuracy</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">99.2%</div>
                        <p className="text-xs text-muted-foreground">True positive detection rate</p>
                    </CardContent>
                </Card>
            </div>
            
            <Tabs defaultValue="dashboard">
                <TabsList>
                    <TabsTrigger value="dashboard">Risk Dashboard</TabsTrigger>
                    <TabsTrigger value="cases">Case Management</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Fraud Attempts (Last 6 Months)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <AdminTransactionOverviewChart />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="cases" className="mt-6">
                    <Card>
                        <CardHeader>
                             <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search case, user, or transaction ID..."
                                    className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Case / User</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Risk Score</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sampleCases.map(c => {
                                        const riskLevel = getRiskLevel(c.riskScore);
                                        const riskClass = riskConfig[riskLevel].className;
                                        return (
                                            <TableRow key={c.id}>
                                                <TableCell>
                                                    <div className="font-medium">{c.id}</div>
                                                    <div className="text-sm text-primary hover:underline cursor-pointer" onClick={() => router.push(`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers/${c.user.id}`)}>{c.user.name}</div>
                                                </TableCell>
                                                <TableCell>{c.reason}</TableCell>
                                                <TableCell className={cn(riskClass, "font-mono")}>{c.riskScore}</TableCell>
                                                <TableCell><Badge variant={c.status === 'Open' ? 'destructive' : 'default'}>{c.status}</Badge></TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem>View Case</DropdownMenuItem>
                                                            <DropdownMenuItem><Check className="mr-2 h-4 w-4"/>Mark as Safe</DropdownMenuItem>
                                                            <DropdownMenuItem><X className="mr-2 h-4 w-4"/>Confirm Fraud</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}
