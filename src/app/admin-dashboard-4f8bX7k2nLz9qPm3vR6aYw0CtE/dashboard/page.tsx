
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ChevronDown, Globe, Landmark, TrendingUp, LineChart } from 'lucide-react';
import { AdminWorldMap } from '@/components/admin-world-map';
import { AdminCurrencyPieChart } from '@/components/admin-currency-pie-chart';
import { AdminTransactionOverviewChart } from '@/components/admin-transaction-overview-chart';

const kpiCards = [
    { title: "Total Volume", value: "$4,231,530.50", change: "+20.1% vs last month", icon: <LineChart className="h-4 w-4 text-muted-foreground" /> },
    { title: "Active Users", value: "+2,350", change: "+180.1% from last month", icon: <TrendingUp className="h-4 w-4 text-muted-foreground" /> },
    { title: "Total Payouts", value: "$1,250,830.20", change: "+19% from last month", icon: <Landmark className="h-4 w-4 text-muted-foreground" /> },
    { title: "Avg. Transaction Value", value: "$45.50", change: "+12.8% vs last month", icon: <Globe className="h-4 w-4 text-muted-foreground" /> },
];

const recentTransactions = [
    { customer: 'Olivia Martin', email: 'olivia.martin@email.com', amount: '$450.00', status: 'Successful', date: '2023-06-23' },
    { customer: 'Jackson Lee', email: 'jackson.lee@email.com', amount: '$1,200.00', status: 'Processing', date: '2023-06-23' },
    { customer: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', amount: '$250.00', status: 'Successful', date: '2023-06-22' },
    { customer: 'William Kim', email: 'will@email.com', amount: '$150.75', status: 'Failed', date: '2023-06-22' },
];

export default function Dashboard() {
    return (
        <>
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
                            <p className="text-xs text-muted-foreground">{item.change}</p>
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentTransactions.map(tx => (
                                <TableRow key={tx.customer}>
                                    <TableCell>
                                        <div className="font-medium">{tx.customer}</div>
                                        <div className="text-sm text-muted-foreground">{tx.email}</div>
                                    </TableCell>
                                    <TableCell>{tx.status}</TableCell>
                                    <TableCell className="text-right">{tx.amount}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
