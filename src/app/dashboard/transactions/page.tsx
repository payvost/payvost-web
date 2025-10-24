
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileDown, ListFilter, MoreHorizontal, Search } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function TransactionsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
            const sortedTransactions = (doc.data().transactions || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(sortedTransactions);
        }
        setLoading(false);
    });
    return () => unsub();
  }, [user]);


  const renderTransactionsTable = (filteredTransactions: typeof transactions) => (
    <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Status</TableHead>
              <TableHead className="hidden text-right md:table-cell">Date</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                 [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5}>
                             <Skeleton className="h-10 w-full" />
                        </TableCell>
                    </TableRow>
                 ))
            ) : filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <div className="font-medium">{tx.recipientName || tx.recipient}</div>
                  <div className="text-sm text-muted-foreground hidden md:inline">{tx.type}</div>
                </TableCell>
                <TableCell className="text-right">{tx.sendAmount ? `${tx.sendCurrency} ${tx.sendAmount}` : tx.amount}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <Badge 
                    variant={
                      tx.status === 'Completed' ? 'default' : 
                      tx.status === 'Pending' ? 'secondary' : 'destructive'
                    }
                    className="capitalize"
                  >
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-right md:table-cell">{new Date(tx.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/transactions/${tx.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Download Receipt</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No transactions found.
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
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Transactions</h1>
        </div>

        <Tabs defaultValue="all">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <TabsList className="overflow-x-auto sm:overflow-visible">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>
                <div className="flex flex-wrap items-center gap-2">
                    <DateRangePicker className="w-full sm:w-auto" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-1 w-full sm:w-auto">
                                <ListFilter className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Filter
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked>
                                Transfer
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>
                                Bill Payment
                            </DropdownMenuCheckboxItem>
                             <DropdownMenuCheckboxItem>
                                Gift Card
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" variant="outline" className="h-9 gap-1 w-full sm:w-auto">
                        <FileDown className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Export
                        </span>
                    </Button>
                     <Button size="sm" className="h-9 gap-1 w-full sm:w-auto">
                        Download Statement
                    </Button>
                </div>
            </div>
            <div className="mt-4">
                 <Card>
                    <CardHeader>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search transactions..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                            />
                        </div>
                    </CardHeader>
                    <TabsContent value="all">
                        {renderTransactionsTable(transactions)}
                    </TabsContent>
                    <TabsContent value="completed">
                        {renderTransactionsTable(transactions.filter(tx => tx.status === 'Completed'))}
                    </TabsContent>
                    <TabsContent value="pending">
                        {renderTransactionsTable(transactions.filter(tx => tx.status === 'Pending'))}
                    </TabsContent>
                    <TabsContent value="failed">
                        {renderTransactionsTable(transactions.filter(tx => tx.status === 'Failed'))}
                    </TabsContent>
                     <CardFooter>
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>1-{transactions.length}</strong> of <strong>{transactions.length}</strong> transactions
                        </div>
                    </CardFooter>
                 </Card>
            </div>
        </Tabs>
      </main>
    </DashboardLayout>
  );
}
