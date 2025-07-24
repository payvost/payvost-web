
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ChevronDown, Globe, Landmark, TrendingUp } from 'lucide-react';
import { AdminWorldMap } from '@/components/admin-world-map';
import { AdminCurrencyPieChart } from '@/components/admin-currency-pie-chart';

const continentPayouts = [
    { name: 'Africa', volume: '$1,250,000', change: '+15.2%', icon: <Globe className="h-6 w-6 text-green-500" /> },
    { name: 'North America', volume: '$850,000', change: '+8.1%', icon: <Globe className="h-6 w-6 text-blue-500" /> },
    { name: 'Europe', volume: '$2,150,000', change: '+12.5%', icon: <Globe className="h-6 w-6 text-yellow-500" /> },
    { name: 'Asia', volume: '$750,000', change: '+5.8%', icon: <Globe className="h-6 w-6 text-red-500" /> },
];

const countryStats = [
    { country: 'Nigeria', currency: 'NGN', volume: '$550,230', transactions: 12450, avgValue: '$44.20', flag: 'ng' },
    { country: 'United Kingdom', currency: 'GBP', volume: '$1,100,500', transactions: 8900, avgValue: '$123.65', flag: 'gb' },
    { country: 'United States', currency: 'USD', volume: '$620,000', transactions: 15200, avgValue: '$40.79', flag: 'us' },
    { country: 'Ghana', currency: 'GHS', volume: '$320,100', transactions: 7500, avgValue: '$42.68', flag: 'gh' },
    { country: 'Kenya', currency: 'KES', volume: '$280,450', transactions: 6800, avgValue: '$41.24', flag: 'ke' },
];

export default function GlobalOverviewPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Global Overview</h2>
                    <p className="text-muted-foreground">A high-level view of your platform's international performance.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <DateRangePicker />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                All Regions <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>All Regions</DropdownMenuItem>
                            <DropdownMenuItem>Africa</DropdownMenuItem>
                            <DropdownMenuItem>North America</DropdownMenuItem>
                            <DropdownMenuItem>Europe</DropdownMenuItem>
                            <DropdownMenuItem>Asia</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {continentPayouts.map(item => (
                    <Card key={item.name}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{item.name} Payout Volume</CardTitle>
                            {item.icon}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{item.volume}</div>
                            <p className="text-xs text-muted-foreground">{item.change} from last month</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Transaction Heat Map</CardTitle>
                        <CardDescription>Visual representation of transaction volume by country.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] p-0">
                        <AdminWorldMap />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Currency Distribution</CardTitle>
                        <CardDescription>Breakdown of total transaction volume by currency.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <AdminCurrencyPieChart />
                    </CardContent>
                </Card>
            </div>
            
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Country Specific Statistics</CardTitle>
                    <CardDescription>Drill-down into performance metrics for top countries.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Country</TableHead>
                                <TableHead>Payout Currency</TableHead>
                                <TableHead>Total Volume</TableHead>
                                <TableHead>Transactions</TableHead>
                                <TableHead className="text-right">Avg. Transaction Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {countryStats.map(stat => (
                                <TableRow key={stat.country}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <img src={`/flags/${stat.flag.toUpperCase()}.png`} alt={stat.country} className="h-4 w-6 object-cover"/>
                                        {stat.country}
                                    </TableCell>
                                    <TableCell>{stat.currency}</TableCell>
                                    <TableCell>{stat.volume}</TableCell>
                                    <TableCell>{stat.transactions.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{stat.avgValue}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
