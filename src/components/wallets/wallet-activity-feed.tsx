'use client';

import Link from 'next/link';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CreditCard } from 'lucide-react';

export type ActivityItem =
  | {
      kind: 'ledger';
      id: string;
      createdAt: string;
      currency: string;
      amount: number;
      direction: 'credit' | 'debit';
      description?: string | null;
    }
  | {
      kind: 'transfer';
      id: string;
      createdAt: string;
      currency: string;
      amount: number;
      status?: string;
      description?: string | null;
    }
  | {
      kind: 'external';
      id: string;
      createdAt: string;
      currency: string;
      amount: number;
      status?: string;
      description?: string | null;
      provider?: string | null;
    };

function formatMoney(amount: number, currency: string, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(amount);
}

function matchesTab(item: ActivityItem, tab: string) {
  if (tab === 'all') return true;
  if (tab === 'credits') return item.kind === 'ledger' && item.direction === 'credit';
  if (tab === 'debits') return item.kind === 'ledger' && item.direction === 'debit';
  if (tab === 'transfers') return item.kind === 'transfer';
  if (tab === 'topups') return item.kind === 'external' || (item.kind === 'ledger' && (item.description || '').toLowerCase().includes('top-up'));
  return true;
}

function rowIcon(item: ActivityItem) {
  if (item.kind === 'transfer') return <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />;
  if (item.kind === 'external') return <CreditCard className="h-4 w-4 text-muted-foreground" />;
  if (item.kind === 'ledger') return item.direction === 'credit'
    ? <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
    : <ArrowUpRight className="h-4 w-4 text-rose-600" />;
  return null;
}

function rowBadge(item: ActivityItem) {
  if (item.kind === 'transfer') return <Badge variant="outline">Transfer</Badge>;
  if (item.kind === 'external') return <Badge variant="outline">{item.provider || 'External'}</Badge>;
  if (item.kind === 'ledger') return <Badge variant="outline">{item.direction === 'credit' ? 'Credit' : 'Debit'}</Badge>;
  return null;
}

export function WalletActivityFeed(props: {
  items: ActivityItem[];
  loading?: boolean;
}) {
  const { items, loading } = props;

  const renderTable = (tab: string) => {
    const filtered = items.filter(i => matchesTab(i, tab));

    return (
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden text-right md:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(6)].map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-sm text-muted-foreground">
                  No activity yet.
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice(0, 15).map(item => (
                <TableRow key={`${item.kind}:${item.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {rowIcon(item)}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">
                            {item.description || (item.kind === 'transfer' ? 'Transfer' : item.kind === 'external' ? 'External transaction' : 'Ledger entry')}
                          </div>
                          {rowBadge(item)}
                        </div>
                        {item.kind === 'transfer' && item.status ? (
                          <div className="text-xs text-muted-foreground">Status: {item.status}</div>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={item.kind === 'ledger' ? (item.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600') : ''}>
                      {item.kind === 'ledger' && item.direction === 'debit' ? '-' : ''}
                      {formatMoney(item.amount, item.currency)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right md:table-cell text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Ledger-backed wallet activity and transaction signals.</CardDescription>
      </CardHeader>
      <Tabs defaultValue="all">
        <TabsList className="mx-6 grid w-[calc(100%-3rem)] grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="debits">Debits</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="topups">Top-ups</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="animate-in fade-in-50">
          {renderTable('all')}
        </TabsContent>
        <TabsContent value="credits" className="animate-in fade-in-50">
          {renderTable('credits')}
        </TabsContent>
        <TabsContent value="debits" className="animate-in fade-in-50">
          {renderTable('debits')}
        </TabsContent>
        <TabsContent value="transfers" className="animate-in fade-in-50">
          {renderTable('transfers')}
        </TabsContent>
        <TabsContent value="topups" className="animate-in fade-in-50">
          {renderTable('topups')}
        </TabsContent>
      </Tabs>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/dashboard/transactions">View all transactions</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
