
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileDown, ListFilter, MoreHorizontal, Search, CheckCircle, Clock, AlertTriangle, RefreshCw, Layers3, Send, AlertCircle } from 'lucide-react';
import type { Settlement } from '@/types/settlement';

const sampleSettlements: Settlement[] = [
  { id: 'set_1a2b', batchId: 'batch_001', destination: 'Creatify Studio (Stripe)', amount: 15230.50, currency: 'USD', status: 'Completed', createdAt: '2024-08-15 10:00 UTC', completedAt: '2024-08-15 10:05 UTC' },
  { id: 'set_1a2c', batchId: 'batch_002', destination: 'Gourmet Goods (Bank)', amount: 250.00, currency: 'USD', status: 'In Progress', createdAt: '2024-08-15 11:00 UTC' },
  { id: 'set_1a2d', batchId: 'batch_002', destination: 'Digital Nomads Inc. (Wise)', amount: 8900.00, currency: 'USD', status: 'Pending', createdAt: '2024-08-15 11:00 UTC' },
  { id: 'set_1a2e', batchId: 'batch_003', destination: 'The Art Corner (Bank)', amount: 5400.75, currency: 'USD', status: 'Failed', createdAt: '2024-08-14 09:00 UTC', reason: 'Invalid account number' },
  { id: 'set_1a2f', batchId: 'batch_004', destination: 'Tech Gadgets Online (Stripe)', amount: 112050.00, currency: 'USD', status: 'Pending', createdAt: '2024-08-15 12:00 UTC' },
];

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Completed: 'default',
  'In Progress': 'secondary',
  Pending: 'outline',
  Failed: 'destructive',
};

export default function SettlementEnginePage() {
    
    const renderSettlementsTable = (data: Settlement[]) => (
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch / Settlement ID</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
                <TableRow key={item.id}>
                    <TableCell>
                        <div className="font-medium">{item.batchId}</div>
                        <div className="text-xs text-muted-foreground">{item.id}</div>
                    </TableCell>
                    <TableCell>{item.destination}</TableCell>
                    <TableCell className="text-right font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.amount)}</TableCell>
                    <TableCell>
                        <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
                        {item.status === 'Failed' && <p className="text-xs text-destructive mt-1">{item.reason}</p>}
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                {item.status === 'Failed' && <DropdownMenuItem><RefreshCw className="mr-2 h-4 w-4"/>Retry Settlement</DropdownMenuItem>}
                                <DropdownMenuItem>View Log</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
    );
    
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settlement Engine</h2>
                    <p className="text-muted-foreground">Monitor and manage payouts to users and merchants.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">Pause All Payouts</Button>
                    <Button>Initiate Manual Batch</Button>
                </div>
            </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Settled (24h)</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$1,250,345.89</div>
                        <p className="text-xs text-muted-foreground">from 5,231 settlements</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                        <Layers3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$120,950.00</div>
                        <p className="text-xs text-muted-foreground">in 2 upcoming batches</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed Attempts (24h)</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">check retry queue for details</p>
                    </CardContent>
                </Card>
            </div>
            
            <Tabs defaultValue="all">
                <div className="flex items-center justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                        <TabsTrigger value="failed">Retry Queue</TabsTrigger>
                    </TabsList>
                     <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by batch or destination..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                            />
                        </div>
                        <DateRangePicker />
                    </div>
                </div>

                 <Card className="mt-4">
                    <CardContent className="p-0">
                         <TabsContent value="all">
                            {renderSettlementsTable(sampleSettlements)}
                        </TabsContent>
                        <TabsContent value="pending">
                            {renderSettlementsTable(sampleSettlements.filter(s => s.status === 'Pending'))}
                        </TabsContent>
                        <TabsContent value="in-progress">
                            {renderSettlementsTable(sampleSettlements.filter(s => s.status === 'In Progress'))}
                        </TabsContent>
                        <TabsContent value="failed">
                            {renderSettlementsTable(sampleSettlements.filter(s => s.status === 'Failed'))}
                        </TabsContent>
                    </CardContent>
                     <CardFooter>
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>1-5</strong> of <strong>{sampleSettlements.length}</strong> settlements
                        </div>
                    </CardFooter>
                </Card>
            </Tabs>
        </>
    )
}
