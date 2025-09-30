
'use client';

import * as React from 'react';
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

const remittances = [
  { id: 'rem_1a2b3c', from: 'USA', to: 'NGA', fromAmount: 1000, toAmount: 1450000, fxRate: '1450.00', partner: 'Stripe', channel: 'Bank Deposit', status: 'Completed', deliveryTime: '15 mins', profit: 12.50 },
  { id: 'rem_4d5e6f', from: 'GBR', to: 'GHA', fromAmount: 500, toAmount: 7650, fxRate: '15.30', partner: 'Wise', channel: 'Mobile Money', status: 'Processing', deliveryTime: 'N/A', profit: 7.20 },
  { id: 'rem_7g8h9i', from: 'CAN', to: 'KEN', fromAmount: 750, toAmount: 99750, fxRate: '133.00', partner: 'WorldRemit', channel: 'Bank Deposit', status: 'Delayed', deliveryTime: '2 hrs', profit: 9.80 },
  { id: 'rem_1j2k3l', from: 'USA', to: 'GBR', fromAmount: 2500, toAmount: 1975, fxRate: '0.79', partner: 'Stripe', channel: 'Bank Deposit', status: 'Failed', deliveryTime: 'N/A', profit: 0.00 },
  { id: 'rem_4m5n6o', from: 'NGA', to: 'USA', fromAmount: 500000, toAmount: 340, fxRate: '0.00068', partner: 'Local Bank', channel: 'Bank Deposit', status: 'Completed', deliveryTime: '25 mins', profit: 5.10 },
];

type Status = 'Completed' | 'Processing' | 'Failed' | 'Delayed';
const statusConfig: Record<Status, { icon: React.ReactNode; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Completed: { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600', variant: 'default'},
    Processing: { icon: <Clock className="h-4 w-4" />, color: 'text-yellow-600', variant: 'secondary'},
    Failed: { icon: <XCircle className="h-4 w-4" />, color: 'text-red-600', variant: 'destructive'},
    Delayed: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-orange-600', variant: 'destructive'},
};

const kpiCards = [
    { title: "Total Volume (24h)", value: "$1.2M", change: "+5.2% vs yesterday", icon: <LineChart className="h-4 w-4 text-muted-foreground" /> },
    { title: "Successful Payouts (24h)", value: "1,402", change: "+120 vs yesterday", icon: <CheckCircle className="h-4 w-4 text-muted-foreground" /> },
    { title: "Avg. Delivery Time", value: "22 Mins", change: "-3 mins vs yesterday", icon: <Timer className="h-4 w-4 text-muted-foreground" /> },
    { title: "Delayed Transactions", value: "14", change: "+2 vs yesterday", icon: <AlertTriangle className="h-4 w-4 text-muted-foreground" /> },
];

export default function AdminRemittancesPage() {
    
    const renderRemittancesTable = (data: typeof remittances) => (
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>Corridor</TableHead>
              <TableHead>Partner / Channel</TableHead>
              <TableHead className="text-right">Amounts</TableHead>
              <TableHead>Delivery Time</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((rem) => {
                const status = statusConfig[rem.status as Status];
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
                                <img src={`/flag/${rem.from}.png`} alt={rem.from} className="h-4 w-6 object-cover"/>
                                <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                                <img src={`/flag/${rem.to}.png`} alt={rem.to} className="h-4 w-6 object-cover"/>
                            </div>
                        </TableCell>
                         <TableCell>
                            <div className="font-medium">{rem.partner}</div>
                            <div className="text-xs text-muted-foreground">{rem.channel}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                            <div title={`From: ${rem.fromAmount} ${rem.from}`}>
                                {new Intl.NumberFormat().format(rem.fromAmount)} {rem.from}
                            </div>
                            <div title={`To: ${rem.toAmount} ${rem.to}`}>
                                {new Intl.NumberFormat().format(rem.toAmount)} {rem.to}
                            </div>
                        </TableCell>
                        <TableCell>{rem.deliveryTime}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild><Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/transactions/${rem.id}`}>View Details</Link></DropdownMenuItem>
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
    
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Remittance Management</h2>
                    <p className="text-muted-foreground">Monitor and manage all cross-border transactions.</p>
                </div>
            </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
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

            <Tabs defaultValue="all">
                <div className="flex items-center justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="all">All Remittances</TabsTrigger>
                        <TabsTrigger value="delayed">Delayed Queue</TabsTrigger>
                    </TabsList>
                     <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search transaction ID..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                            />
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 gap-1">
                                <ListFilter className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem checked>Status</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>Corridor</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>Partner</DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DateRangePicker />
                    </div>
                </div>

                 <Card className="mt-4">
                    <CardContent className="p-0">
                         <TabsContent value="all">
                            {renderRemittancesTable(remittances)}
                        </TabsContent>
                        <TabsContent value="delayed">
                            {renderRemittancesTable(remittances.filter(r => r.status === 'Delayed'))}
                        </TabsContent>
                    </CardContent>
                     <CardFooter>
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>1-5</strong> of <strong>250</strong> remittances
                        </div>
                    </CardFooter>
                </Card>
            </Tabs>
        </>
    )
}
