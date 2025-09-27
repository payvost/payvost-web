
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileDown, ListFilter, MoreHorizontal, Search, ShieldQuestion, Target, CircleDollarSign, PlusCircle } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Progress } from '@/components/ui/progress';
import { RaiseDisputeForm } from '@/components/raise-dispute-form';

const disputes = [
  { id: 'CASE-48292', customer: 'John Doe', email: 'john.d@example.com', amount: '$150.00', reason: 'Product not received', status: 'Needs response', dueBy: '2024-08-10' },
  { id: 'CASE-48285', customer: 'Jane Smith', email: 'jane.s@example.com', amount: '$75.50', reason: 'Fraudulent', status: 'Under review', dueBy: '2024-08-12' },
  { id: 'CASE-48279', customer: 'Pierre Dupont', email: 'pierre.d@example.com', amount: '$320.00', reason: 'Product unacceptable', status: 'Won', dueBy: '2024-07-25' },
  { id: 'CASE-48271', customer: 'Adebayo Adekunle', email: 'adebayo.a@example.com', amount: '$50.00', reason: 'Duplicate', status: 'Lost', dueBy: '2024-07-22' },
  { id: 'CASE-48263', customer: 'Emily White', email: 'emily.w@example.com', amount: '$500.00', reason: 'Credit not processed', status: 'Needs response', dueBy: '2024-08-15' },
  { id: 'CASE-48250', customer: 'Satoshi Nakamoto', email: 'satoshi@gmx.com', amount: '$1,200.00', reason: 'Fraudulent', status: 'Under review', dueBy: '2024-08-18' },
];

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Needs response': 'destructive',
  'Under review': 'secondary',
  'Won': 'default',
  'Lost': 'outline',
};

const statusTextClass: { [key: string]: string } = {
    'Won': 'text-green-500',
    'Lost': 'text-muted-foreground',
}

type View = 'list' | 'create';


export default function DisputePage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [view, setView] = useState<View>('list');

  const renderDisputesTable = (filteredDisputes: typeof disputes) => (
    <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Reason</TableHead>
              <TableHead className="hidden sm:table-cell">Due By</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDisputes.length > 0 ? filteredDisputes.map((dispute) => (
              <TableRow key={dispute.id}>
                <TableCell>
                  <div className="font-medium">{dispute.id}</div>
                  <Badge variant={statusVariant[dispute.status]} className="capitalize mt-1 md:hidden">{dispute.status}</Badge>
                </TableCell>
                <TableCell>
                    <div className="font-medium">{dispute.customer}</div>
                    <div className="text-sm text-muted-foreground hidden md:inline">{dispute.email}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col">
                        <span>{dispute.reason}</span>
                        <Badge variant={statusVariant[dispute.status]} className="capitalize mt-1 w-fit">{dispute.status}</Badge>
                    </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{dispute.dueBy}</TableCell>
                <TableCell className="text-right">{dispute.amount}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Submit Evidence</DropdownMenuItem>
                        <DropdownMenuItem>Accept Dispute</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No disputes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
  );
  
  const renderListView = () => (
    <>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-2xl">Dispute Center</h1>
          <Button onClick={() => setView('create')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Raise a New Dispute
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Needs Response</CardTitle>
                    <ShieldQuestion className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">2</div>
                    <p className="text-xs text-muted-foreground">Disputes requiring your immediate attention.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Amount Under Review</CardTitle>
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$1,275.50</div>
                    <p className="text-xs text-muted-foreground">Total value of all open disputes.</p>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <TabsList className="overflow-x-auto sm:overflow-visible">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="needs-response">Needs Response</TabsTrigger>
                    <TabsTrigger value="under-review">Under Review</TabsTrigger>
                    <TabsTrigger value="closed">Closed</TabsTrigger>
                </TabsList>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by case ID, email..."
                            className="w-full rounded-lg bg-background pl-8 h-9"
                        />
                    </div>
                     <DateRangePicker className="w-full sm:w-auto" />
                    <Button size="sm" variant="outline" className="h-9 gap-1 w-full sm:w-auto">
                        <FileDown className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Export
                        </span>
                    </Button>
                </div>
            </div>
            <div className="mt-4">
                 <Card>
                    <TabsContent value="all">
                        {renderDisputesTable(disputes)}
                    </TabsContent>
                    <TabsContent value="needs-response">
                        {renderDisputesTable(disputes.filter(d => d.status === 'Needs response'))}
                    </TabsContent>
                    <TabsContent value="under-review">
                        {renderDisputesTable(disputes.filter(d => d.status === 'Under review'))}
                    </TabsContent>
                    <TabsContent value="closed">
                        {renderDisputesTable(disputes.filter(d => ['Won', 'Lost'].includes(d.status)))}
                    </TabsContent>
                     <CardFooter>
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>1-6</strong> of <strong>{disputes.length}</strong> disputes
                        </div>
                    </CardFooter>
                 </Card>
            </div>
        </Tabs>
    </>
  );

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {view === 'list' ? renderListView() : <RaiseDisputeForm onBack={() => setView('list')} />}
      </main>
    </DashboardLayout>
  );
}
