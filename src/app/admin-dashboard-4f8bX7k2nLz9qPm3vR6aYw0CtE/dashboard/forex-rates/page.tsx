
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Globe, Percent, SlidersHorizontal, RefreshCw, PlusCircle, Edit, PauseCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ForexRate } from '@/types/forex-rate';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const staticDate = '2024-08-15T12:00:00Z';
const initialRates: ForexRate[] = [
    { id: 'rate_1', currencyPair: 'USD/NGN', baseRate: 1450.50, markup: 0.75, customerRate: 1461.38, status: 'Active', lastUpdated: staticDate },
    { id: 'rate_2', currencyPair: 'GBP/GHS', baseRate: 15.30, markup: 1.00, customerRate: 15.45, status: 'Active', lastUpdated: staticDate },
    { id: 'rate_3', currencyPair: 'EUR/KES', baseRate: 133.00, markup: 0.80, customerRate: 134.06, status: 'Paused', lastUpdated: new Date(new Date(staticDate).getTime() - 3600 * 1000).toISOString() },
    { id: 'rate_4', currencyPair: 'USD/GBP', baseRate: 0.79, markup: 0.50, customerRate: 0.794, status: 'Active', lastUpdated: staticDate },
    { id: 'rate_5', currencyPair: 'USD/EUR', baseRate: 0.92, markup: 0.50, customerRate: 0.925, status: 'Active', lastUpdated: staticDate },
];

const statusConfig = {
    Active: 'bg-green-500/20 text-green-700',
    Paused: 'bg-yellow-500/20 text-yellow-700',
};

// A small component to render time only on the client
function ClientTime({ dateString }: { dateString: string }) {
    const [time, setTime] = React.useState('');
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
        setTime(new Date(dateString).toLocaleTimeString());
    }, [dateString]);

    if (!isMounted) {
        return null;
    }

    return <>{time}</>;
}


export default function ForexRatesPage() {
    const { toast } = useToast();

    const handleRefreshRates = () => {
        toast({
            title: "Refreshing Rates...",
            description: "Fetching the latest rates from our providers.",
        });
    }

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Foreign Exchange Rates</h2>
                    <p className="text-muted-foreground">Monitor and manage FX rates, markups, and providers.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline"><SlidersHorizontal className="mr-2 h-4 w-4"/>Provider Rules</Button>
                    <Button onClick={handleRefreshRates}><RefreshCw className="mr-2 h-4 w-4"/>Refresh All Rates</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monitored Pairs</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{initialRates.length}</div>
                        <p className="text-xs text-muted-foreground">Actively tracked currency pairs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Markup</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0.71%</div>
                        <p className="text-xs text-muted-foreground">Platform-wide average profit margin</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paused Rates</CardTitle>
                        <PauseCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{initialRates.filter(r => r.status === 'Paused').length}</div>
                        <p className="text-xs text-muted-foreground">Pairs with manual rate locks</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle>Live FX Rates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Currency Pair</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Base Rate</TableHead>
                                        <TableHead className="text-right">Markup (%)</TableHead>
                                        <TableHead className="text-right">Customer Rate</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {initialRates.map((rate) => (
                                        <TableRow key={rate.id}>
                                            <TableCell>
                                                <div className="font-medium">{rate.currencyPair}</div>
                                                <div className="text-xs text-muted-foreground">Last updated: <ClientTime dateString={rate.lastUpdated} /></div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn(statusConfig[rate.status])}>{rate.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{rate.baseRate.toFixed(4)}</TableCell>
                                            <TableCell className="text-right font-mono">{rate.markup.toFixed(2)}%</TableCell>
                                            <TableCell className="text-right font-mono font-semibold">{rate.customerRate.toFixed(4)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4"/>Adjust Markup</DropdownMenuItem>
                                                        <DropdownMenuItem><PauseCircle className="mr-2 h-4 w-4"/>Toggle Auto-Update</DropdownMenuItem>
                                                        <DropdownMenuItem>View History</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle>Adjust Rates</CardTitle>
                             <CardDescription>Add or update a currency pair's markup.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currency-pair">Currency Pair</Label>
                                <Input id="currency-pair" placeholder="e.g., USD/CAD" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="markup">Markup (%)</Label>
                                <Input id="markup" type="number" step="0.01" placeholder="e.g., 0.85" />
                            </div>
                        </CardContent>
                         <CardFooter>
                            <Button className="w-full"><PlusCircle className="mr-2 h-4 w-4"/>Save or Add Rule</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    );
}
