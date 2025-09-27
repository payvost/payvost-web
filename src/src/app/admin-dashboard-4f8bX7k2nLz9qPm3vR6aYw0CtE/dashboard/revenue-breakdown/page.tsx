
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { FileDown, DollarSign, Receipt, TrendingUp, HandCoins, Store, ArrowRightLeft } from 'lucide-react';
import { AdminCurrencyPieChart } from '@/components/admin-currency-pie-chart';

const kpiCards = [
    { title: "Total Revenue (Gross)", value: "$48,530.50", change: "+12.5% vs last period", icon: <DollarSign className="h-4 w-4 text-muted-foreground" /> },
    { title: "Total Fees Collected", value: "$1,250.75", change: "+8.2% vs last period", icon: <Receipt className="h-4 w-4 text-muted-foreground" /> },
    { title: "Net Platform Profit", value: "$47,279.75", change: "+12.8% vs last period", icon: <TrendingUp className="h-4 w-4 text-muted-foreground" /> },
];

const revenueByCurrency = [
    { currency: 'USD', volume: 1250000, transactions: 4500, fees: 12500, net: 1237500 },
    { currency: 'GBP', volume: 850000, transactions: 3200, fees: 9800, net: 840200 },
    { currency: 'NGN', volume: 750000000, transactions: 12000, fees: 5500000, net: 744500000 },
    { currency: 'EUR', volume: 950000, transactions: 2800, fees: 10500, net: 939500 },
];

const revenueByType = [
    { type: 'P2P Transfers', icon: <ArrowRightLeft className="h-5 w-5 mr-3"/>, volume: 2500000, transactions: 15000, fees: 25000 },
    { type: 'Merchant Payments', icon: <Store className="h-5 w-5 mr-3"/>, volume: 1800000, transactions: 8000, fees: 18000 },
    { type: 'Payment Links', icon: <HandCoins className="h-5 w-5 mr-3"/>, volume: 500000, transactions: 3000, fees: 7500 },
];

const topMerchants = [
    { name: 'Creatify Studio', volume: 125000, fees: 1875 },
    { name: 'Gourmet Goods', volume: 98000, fees: 1470 },
    { name: 'Digital Nomads Inc.', volume: 85000, fees: 1275 },
];

const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function RevenueBreakdownPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Revenue Breakdown</h2>
                    <p className="text-muted-foreground">Analyze your platform's revenue and performance.</p>
                </div>
                 <div className="flex items-center space-x-2">
                    <DateRangePicker />
                    <Button><FileDown className="mr-2 h-4 w-4" />Export CSV</Button>
                </div>
            </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {kpiCards.map(card => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            {card.icon}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <p className="text-xs text-muted-foreground">{card.change}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="by-currency">
                <TabsList>
                    <TabsTrigger value="by-currency">By Currency</TabsTrigger>
                    <TabsTrigger value="by-type">By Transaction Type</TabsTrigger>
                    <TabsTrigger value="by-merchant">By Merchant</TabsTrigger>
                </TabsList>
                 <TabsContent value="by-currency" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Revenue by Currency</CardTitle>
                            </CardHeader>
                             <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Currency</TableHead>
                                            <TableHead className="text-right">Total Volume</TableHead>
                                            <TableHead className="text-right">Fees</TableHead>
                                            <TableHead className="text-right">Net Revenue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {revenueByCurrency.map(item => (
                                            <TableRow key={item.currency}>
                                                <TableCell className="font-medium">{item.currency}</TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(item.volume, item.currency)}</TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(item.fees, item.currency)}</TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(item.net, item.currency)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Currency Distribution</CardTitle>
                                <CardDescription>Breakdown of total transaction volume by currency.</CardDescription>
                            </CardHeader>
                             <CardContent className="h-[250px]">
                                <AdminCurrencyPieChart />
                            </CardContent>
                        </Card>
                    </div>
                 </TabsContent>
                <TabsContent value="by-type" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue by Transaction Type</CardTitle>
                        </CardHeader>
                         <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Transactions</TableHead>
                                        <TableHead className="text-right">Total Volume (USD)</TableHead>
                                        <TableHead className="text-right">Fees (USD)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {revenueByType.map(item => (
                                        <TableRow key={item.type}>
                                            <TableCell className="font-medium flex items-center">{item.icon}{item.type}</TableCell>
                                            <TableCell>{item.transactions.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.volume, 'USD')}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.fees, 'USD')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="by-merchant" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Merchants by Revenue</CardTitle>
                        </CardHeader>
                         <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Merchant</TableHead>
                                        <TableHead className="text-right">Total Volume (USD)</TableHead>
                                        <TableHead className="text-right">Fees Generated (USD)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topMerchants.map(item => (
                                        <TableRow key={item.name}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.volume, 'USD')}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.fees, 'USD')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}
