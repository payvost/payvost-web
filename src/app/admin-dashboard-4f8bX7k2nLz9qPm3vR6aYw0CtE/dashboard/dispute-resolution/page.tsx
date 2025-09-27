
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FileDown, ListFilter, MoreHorizontal, Search, ShieldQuestion, Target, CircleDollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import type { Dispute } from '@/types/dispute';


const sampleDisputes: Dispute[] = [
  { id: 'CASE-48292', transactionId: 'txn_1a2b3c4d', customerName: 'John Doe', amount: 150.00, currency: 'USD', reason: 'Product not received', status: 'Needs response', dueBy: '2024-08-20', evidence: [], log: [] },
  { id: 'CASE-48285', transactionId: 'txn_5e6f7g8h', customerName: 'Jane Smith', amount: 75.50, currency: 'USD', reason: 'Fraudulent', status: 'Under review', dueBy: '2024-08-22', evidence: [], log: [] },
  { id: 'CASE-48279', transactionId: 'txn_9i0j1k2l', customerName: 'Pierre Dupont', amount: 320.00, currency: 'EUR', reason: 'Product unacceptable', status: 'Won', dueBy: '2024-07-25', evidence: [], log: [] },
  { id: 'CASE-48271', transactionId: 'txn_3m4n5o6p', customerName: 'Adebayo Adekunle', amount: 50.00, currency: 'NGN', reason: 'Duplicate', status: 'Lost', dueBy: '2024-07-22', evidence: [], log: [] },
];

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Needs response': 'destructive',
  'Under review': 'secondary',
  'Won': 'default',
  'Lost': 'outline',
};

export default function DisputeResolutionPage() {
    const router = useRouter();

    const renderDisputesTable = (filteredDisputes: typeof sampleDisputes) => (
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case / Transaction</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDisputes.map((dispute) => (
              <TableRow key={dispute.id} onClick={() => router.push(`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/dispute-resolution/${dispute.id}`)} className="cursor-pointer">
                <TableCell>
                  <div className="font-medium">{dispute.id}</div>
                  <div className="text-sm text-muted-foreground font-mono">{dispute.transactionId}</div>
                </TableCell>
                <TableCell>{dispute.customerName}</TableCell>
                <TableCell>{dispute.reason}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[dispute.status]} className="capitalize">{dispute.status}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: dispute.currency }).format(dispute.amount)}</TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Case Details</DropdownMenuItem>
                            <DropdownMenuItem>Assign to Agent</DropdownMenuItem>
                            <DropdownMenuItem>Close Case</DropdownMenuItem>
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
                    <h2 className="text-3xl font-bold tracking-tight">Dispute Resolution Center</h2>
                    <p className="text-muted-foreground">Manage chargebacks, complaints, and other disputes.</p>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline"><FileDown className="mr-2 h-4 w-4" />Export Reports</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Disputes Requiring Action</CardTitle>
                        <ShieldQuestion className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1</div>
                        <p className="text-xs text-muted-foreground">Awaiting evidence submission</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount Disputed</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$225.50</div>
                        <p className="text-xs text-muted-foreground">Across 2 open cases</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Win Rate (Last 90d)</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">50%</div>
                        <Progress value={50} className="h-2 mt-2" />
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="all">
                 <div className="flex items-center justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="all">All Open</TabsTrigger>
                        <TabsTrigger value="needs-response">Needs Response</TabsTrigger>
                        <TabsTrigger value="closed">Closed</TabsTrigger>
                    </TabsList>
                     <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by case or transaction ID..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                            />
                        </div>
                        <DateRangePicker />
                    </div>
                </div>

                <Card className="mt-4">
                    <CardContent className="p-0">
                         <TabsContent value="all">
                            {renderDisputesTable(sampleDisputes.filter(d => d.status !== 'Won' && d.status !== 'Lost'))}
                        </TabsContent>
                        <TabsContent value="needs-response">
                            {renderDisputesTable(sampleDisputes.filter(d => d.status === 'Needs response'))}
                        </TabsContent>
                        <TabsContent value="closed">
                           {renderDisputesTable(sampleDisputes.filter(d => d.status === 'Won' || d.status === 'Lost'))}
                        </TabsContent>
                    </CardContent>
                     <CardFooter>
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>1-4</strong> of <strong>{sampleDisputes.length}</strong> disputes
                        </div>
                    </CardFooter>
                </Card>
            </Tabs>
        </>
    )
}
