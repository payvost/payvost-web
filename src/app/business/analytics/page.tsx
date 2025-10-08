
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Percent, RefreshCcw, Landmark, Download, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BusinessTransactionChart } from '@/components/business-transaction-chart';
import { Badge } from '@/components/ui/badge';

const kpiCards = [
    { title: "Gross Revenue", value: "$152,345.67", change: "+18.2%", icon: <DollarSign /> },
    { title: "Net Revenue", value: "$148,987.12", change: "+17.9%", icon: <TrendingUp /> },
    { title: "Refunds", value: "$1,230.00", change: "-5.1%", icon: <TrendingDown /> },
    { title: "Taxes", value: "$2,128.55", change: "+18.2%", icon: <Percent /> },
];

const mockRevenueData = [
  { id: 'txn_1', date: '2024-08-15', type: 'Payment Link', region: 'USA', method: 'Card', gross: 250.00, fee: 7.25, net: 242.75, status: 'Settled' },
  { id: 'txn_2', date: '2024-08-15', type: 'Invoice', region: 'UK', method: 'Bank Transfer', gross: 1200.00, fee: 12.00, net: 1188.00, status: 'Settled' },
  { id: 'txn_3', date: '2024-08-14', type: 'Subscription', region: 'EU', method: 'Card', gross: 49.99, fee: 1.75, net: 48.24, status: 'In Transit' },
  { id: 'txn_4', date: '2024-08-14', type: 'Payment Link', region: 'NGA', method: 'Wallet', gross: 50.00, fee: 0.50, net: 49.50, status: 'Settled' },
  { id: 'txn_5', date: '2024-08-13', type: 'Invoice', region: 'USA', method: 'Card', gross: 800.00, fee: 23.50, net: 776.50, status: 'Refunded' },
];

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
  Settled: 'default',
  'In Transit': 'secondary',
  Refunded: 'destructive',
};

export default function RevenueSummaryPage() {
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
                 {kpiCards.map(card => (
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
                ))}
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
                            {mockRevenueData.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-mono text-xs">{row.date}</TableCell>
                                    <TableCell>{row.type}</TableCell>
                                    <TableCell className="font-mono">${row.gross.toFixed(2)}</TableCell>
                                    <TableCell className="font-mono font-semibold">${row.net.toFixed(2)}</TableCell>
                                    <TableCell><Badge variant={statusVariant[row.status]}>{row.status}</Badge></TableCell>
                                </TableRow>
                            ))}
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
