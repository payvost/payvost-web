
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
import { FileDown, ListFilter, MoreHorizontal, Search, ShieldCheck, Handshake, CircleDollarSign, PlusCircle } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Progress } from '@/components/ui/progress';
import { CreateEscrowAgreementForm } from '@/components/create-escrow-agreement-form';
import Link from 'next/link';

const escrowAgreements = [
  { id: 'ESC-84321', title: 'Website Development for Acme Corp', parties: 'You & Acme Corp', amount: 5000, currency: 'USD', status: 'In Escrow', created: '2024-08-10' },
  { id: 'ESC-84320', title: 'Vintage Camera Purchase', parties: 'You & John Smith', amount: 850, currency: 'GBP', status: 'Funds Released', created: '2024-08-05' },
  { id: 'ESC-84319', title: 'Graphic Design Services', parties: 'You & DesignCo', amount: 1200, currency: 'EUR', status: 'Awaiting Funding', created: '2024-08-12' },
  { id: 'ESC-84315', title: 'Domain Name Sale (qwibik.ai)', parties: 'You & BuyerX', amount: 15000, currency: 'USD', status: 'Disputed', created: '2024-07-28' },
  { id: 'ESC-84311', title: 'Consulting Retainer - Q3', parties: 'You & ClientY', amount: 2500000, currency: 'NGN', status: 'Cancelled', created: '2024-07-25' },
];

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'In Escrow': 'default',
  'Awaiting Funding': 'secondary',
  'Funds Released': 'outline',
  'Disputed': 'destructive',
  'Cancelled': 'outline',
};


export default function EscrowPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [view, setView] = useState<'list' | 'create'>('list');

  const activeAgreementsCount = escrowAgreements.filter(a => ['In Escrow', 'Awaiting Funding'].includes(a.status)).length;
  // Note: For a real app, you'd convert currencies to a base currency for an accurate total.
  // Here we're just summing up the USD amounts for simplicity.
  const totalInEscrow = escrowAgreements
    .filter(a => a.status === 'In Escrow' && a.currency === 'USD')
    .reduce((sum, a) => sum + a.amount, 0);


  const renderListView = () => (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Escrow Center</h1>
          <Button onClick={() => setView('create')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Agreement
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Agreements</CardTitle>
                  <Handshake className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{activeAgreementsCount}</div>
                  <p className="text-xs text-muted-foreground">Currently in progress or awaiting funding.</p>
              </CardContent>
          </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Funds in Escrow (USD)</CardTitle>
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalInEscrow)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total value secured across all active USD agreements.</p>
              </CardContent>
          </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate (Last 90d)</CardTitle>
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">98%</div>
                  <Progress value={98} className="h-2 mt-2" />
              </CardContent>
          </Card>
      </div>

      <Tabs defaultValue="all">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList className="overflow-x-auto sm:overflow-visible">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="disputed">Disputed</TabsTrigger>
              </TabsList>
              <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          type="search"
                          placeholder="Search by ID, title..."
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
                      {renderAgreementsTable(escrowAgreements)}
                  </TabsContent>
                  <TabsContent value="active">
                      {renderAgreementsTable(escrowAgreements.filter(d => ['In Escrow', 'Awaiting Funding'].includes(d.status)))}
                  </TabsContent>
                  <TabsContent value="completed">
                      {renderAgreementsTable(escrowAgreements.filter(d => ['Funds Released', 'Cancelled'].includes(d.status)))}
                  </TabsContent>
                  <TabsContent value="disputed">
                      {renderAgreementsTable(escrowAgreements.filter(d => d.status === 'Disputed'))}
                  </TabsContent>
                    <CardFooter>
                      <div className="text-xs text-muted-foreground">
                          Showing <strong>1-{escrowAgreements.length}</strong> of <strong>{escrowAgreements.length}</strong> agreements
                      </div>
                  </CardFooter>
                </Card>
          </div>
      </Tabs>
    </>
  );

  const renderAgreementsTable = (filteredAgreements: typeof escrowAgreements) => (
    <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agreement</TableHead>
              <TableHead className="hidden md:table-cell">Parties</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgreements.length > 0 ? filteredAgreements.map((agreement) => (
              <TableRow key={agreement.id}>
                <TableCell>
                  <div className="font-medium">{agreement.title}</div>
                  <div className="text-sm text-muted-foreground">{agreement.id}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{agreement.parties}</TableCell>
                <TableCell className="hidden sm:table-cell">
                    <Badge variant={statusVariant[agreement.status]} className="capitalize">{agreement.status}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: agreement.currency }).format(agreement.amount)}
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/escrow/${agreement.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                           <Link href={`/dashboard/escrow/${agreement.id}/manage-funds`}>Manage Funds</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                           <Link href="/dashboard/dispute" className="text-destructive">Raise Dispute</Link>
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No agreements found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
  );

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {view === 'list' ? renderListView() : <CreateEscrowAgreementForm onBack={() => setView('list')} />}
      </main>
    </DashboardLayout>
  );
}
