
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
import { FileDown, ListFilter, MoreHorizontal, Search, List, CheckCircle, Clock, XCircle } from 'lucide-react';
import { EnhancedTabs } from '@/components/enhanced-tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { externalTransactionService } from '@/services';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { EmptyState } from '@/components/empty-state';
import { Receipt, ArrowRightLeft, Send } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  recipientName?: string;
  recipient?: string;
  amount?: string;
  sendAmount?: string;
  sendCurrency?: string;
  currency?: string;
  status: string;
  date: string;
  provider?: string;
  source: 'firebase' | 'external';
}

export default function TransactionsPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string[]>(['transfer', 'bill', 'giftcard', 'airtime']);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Calculate transaction counts by status
  const transactionCounts = {
    all: transactions.length,
    completed: transactions.filter(tx => tx.status === 'Completed').length,
    pending: transactions.filter(tx => tx.status === 'Pending').length,
    failed: transactions.filter(tx => tx.status === 'Failed').length,
  };

  const filterTransactionsByType = (txs: Transaction[]) => {
    return txs.filter(tx => {
      const type = tx.type.toLowerCase();
      return filterType.some(filter => {
        if (filter === 'transfer') return type.includes('transfer') || type.includes('payout');
        if (filter === 'bill') return type.includes('bill');
        if (filter === 'giftcard') return type.includes('gift');
        if (filter === 'airtime') return type.includes('airtime') || type.includes('data');
        return false;
      });
    });
  };

  const filterTransactionsBySearch = (txs: Transaction[]) => {
    if (!searchQuery) return txs;
    const query = searchQuery.toLowerCase();
    return txs.filter(tx => 
      (tx.recipientName?.toLowerCase() || '').includes(query) ||
      (tx.recipient?.toLowerCase() || '').includes(query) ||
      (tx.type?.toLowerCase() || '').includes(query) ||
      (tx.id?.toLowerCase() || '').includes(query)
    );
  };

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    // Fetch Firebase transactions
    const unsub = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
        try {
          const firebaseTransactions = docSnap.exists() 
            ? (docSnap.data().transactions || []).map((tx: any) => ({
                ...tx,
                source: 'firebase' as const,
              }))
            : [];

          // Fetch external transactions from our database
          let externalTransactions: Transaction[] = [];
          try {
            const externalTxs = await externalTransactionService.getByUser(user.uid, { limit: 100 });
            externalTransactions = (externalTxs as any[]).map((tx: any) => ({
              id: tx.id,
              type: formatTransactionType(tx.type),
              recipientName: tx.recipientDetails?.billerName || tx.recipientDetails?.productName || tx.recipientDetails?.phone || 'N/A',
              amount: `${tx.currency} ${tx.amount}`,
              sendAmount: tx.amount.toString(),
              sendCurrency: tx.currency,
              status: formatStatus(tx.status),
              date: tx.createdAt.toString(),
              provider: tx.provider,
              source: 'external' as const,
            }));
          } catch (error) {
            console.error('Failed to fetch external transactions:', error);
          }

          // Combine and sort by date
          const allTransactions = [...firebaseTransactions, ...externalTransactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          setTransactions(allTransactions);
        } catch (error) {
          console.error('Error fetching transactions:', error);
        } finally {
          setLoading(false);
        }
    });
    
    return () => unsub();
  }, [user]);

  const formatTransactionType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'AIRTIME_TOPUP': 'Airtime Top-up',
      'DATA_BUNDLE': 'Data Bundle',
      'GIFT_CARD': 'Gift Card',
      'BILL_PAYMENT': 'Bill Payment',
      'PAYMENT': 'Payment',
      'PAYOUT': 'Payout',
      'VIRTUAL_ACCOUNT_DEPOSIT': 'Deposit',
      'WALLET_TRANSFER': 'Transfer',
    };
    return typeMap[type] || type;
  };

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pending',
      'PROCESSING': 'Pending',
      'COMPLETED': 'Completed',
      'FAILED': 'Failed',
      'CANCELLED': 'Failed',
      'REFUNDED': 'Refunded',
    };
    return statusMap[status] || status;
  };

  const getProviderBadge = (provider?: string) => {
    if (!provider) return null;
    return (
      <Badge variant="outline" className="ml-2 text-xs">
        {provider}
      </Badge>
    );
  };


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
              <ContextMenu key={tx.id}>
                <ContextMenuTrigger asChild>
                  <TableRow>
                    <TableCell>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="font-medium cursor-pointer">
                            {tx.recipientName || tx.recipient}
                            {getProviderBadge(tx.provider)}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-semibold">Transaction Details</span>
                              <Badge variant={tx.status === 'Completed' ? 'default' : tx.status === 'Pending' ? 'secondary' : 'destructive'}>
                                {tx.status}
                              </Badge>
                            </div>
                            <div className="text-sm space-y-1">
                              <div><span className="font-medium">Type:</span> {tx.type}</div>
                              <div><span className="font-medium">Amount:</span> {tx.amount || `${tx.sendCurrency} ${tx.sendAmount}`}</div>
                              <div><span className="font-medium">Date:</span> {new Date(tx.date).toLocaleString()}</div>
                              {tx.provider && <div><span className="font-medium">Provider:</span> {tx.provider}</div>}
                              {tx.source && <div><span className="font-medium">Source:</span> {tx.source}</div>}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                      <div className="text-sm text-muted-foreground hidden md:inline">{tx.type}</div>
                </TableCell>
                <TableCell className="text-right">{tx.sendAmount ? `${tx.sendCurrency} ${tx.sendAmount}` : tx.amount}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <Badge 
                    variant={
                      tx.status === 'Completed' ? 'default' : 
                      tx.status === 'Pending' ? 'secondary' : 
                      tx.status === 'Refunded' ? 'outline' :
                      'destructive'
                    }
                    className="capitalize"
                  >
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-right md:table-cell">{new Date(tx.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
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
                                        {tx.source === 'external' && (
                                            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                                External: {tx.provider}
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Transaction actions</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </TableCell>
              </TableRow>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => navigator.clipboard.writeText(tx.id)}>
                        Copy Transaction ID
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => navigator.clipboard.writeText(tx.sendAmount || tx.amount || '')}>
                        Copy Amount
                    </ContextMenuItem>
                    <ContextMenuItem disabled={tx.status !== 'Completed'}>
                        Download Receipt
                    </ContextMenuItem>
                    <ContextMenuItem disabled={tx.status !== 'Pending'}>
                        Cancel Transaction
                    </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-96 p-0">
                  <EmptyState
                    icon={<Receipt className="h-12 w-12" />}
                    title={searchQuery || filterType.length < 4 ? "No transactions found" : "No transactions yet"}
                    description={
                      searchQuery || filterType.length < 4
                        ? "Try adjusting your search or filters to find what you're looking for."
                        : "Your transaction history will appear here once you start sending or receiving money."
                    }
                    action={
                      !searchQuery && filterType.length === 4
                        ? {
                            label: "Send Money",
                            onClick: () => router.push('/dashboard/payments'),
                          }
                        : undefined
                    }
                    showCard={false}
                    size="md"
                  />
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
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Transactions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Transactions</h1>
        </div>

        <EnhancedTabs 
          defaultValue="all" 
          value={activeTab}
          onValueChange={setActiveTab}
          showCounts={true}
          tabs={[
            {
              value: 'all',
              label: 'All',
              icon: List,
              count: transactionCounts.all,
              tooltip: 'View all transactions'
            },
            {
              value: 'completed',
              label: 'Completed',
              icon: CheckCircle,
              count: transactionCounts.completed,
              tooltip: 'View completed transactions'
            },
            {
              value: 'pending',
              label: 'Pending',
              icon: Clock,
              count: transactionCounts.pending,
              tooltip: 'View pending transactions'
            },
            {
              value: 'failed',
              label: 'Failed',
              icon: XCircle,
              count: transactionCounts.failed,
              tooltip: 'View failed transactions'
            }
          ]}
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
                <div className="flex flex-wrap items-center gap-2">
                    <DateRangePicker className="w-full sm:w-auto" />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
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
                            <DropdownMenuCheckboxItem 
                              checked={filterType.includes('transfer')}
                              onCheckedChange={(checked) => {
                                setFilterType(prev => 
                                  checked ? [...prev, 'transfer'] : prev.filter(t => t !== 'transfer')
                                );
                              }}
                            >
                                Transfer
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={filterType.includes('bill')}
                              onCheckedChange={(checked) => {
                                setFilterType(prev => 
                                  checked ? [...prev, 'bill'] : prev.filter(t => t !== 'bill')
                                );
                              }}
                            >
                                Bill Payment
                            </DropdownMenuCheckboxItem>
                             <DropdownMenuCheckboxItem
                              checked={filterType.includes('giftcard')}
                              onCheckedChange={(checked) => {
                                setFilterType(prev => 
                                  checked ? [...prev, 'giftcard'] : prev.filter(t => t !== 'giftcard')
                                );
                              }}
                            >
                                Gift Card
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={filterType.includes('airtime')}
                              onCheckedChange={(checked) => {
                                setFilterType(prev => 
                                  checked ? [...prev, 'airtime'] : prev.filter(t => t !== 'airtime')
                                );
                              }}
                            >
                                Airtime/Data
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Filter transactions by type</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" className="h-9 gap-1 w-full sm:w-auto">
                                    <FileDown className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    Export
                                    </span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Export transactions to CSV</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
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
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                            />
                        </div>
                    </CardHeader>
                    <TabsContent value="all" className="animate-in fade-in-50">
                        {renderTransactionsTable(filterTransactionsBySearch(filterTransactionsByType(transactions)))}
                    </TabsContent>
                    <TabsContent value="completed" className="animate-in fade-in-50">
                        {renderTransactionsTable(filterTransactionsBySearch(filterTransactionsByType(transactions.filter(tx => tx.status === 'Completed'))))}
                    </TabsContent>
                    <TabsContent value="pending" className="animate-in fade-in-50">
                        {renderTransactionsTable(filterTransactionsBySearch(filterTransactionsByType(transactions.filter(tx => tx.status === 'Pending'))))}
                    </TabsContent>
                    <TabsContent value="failed" className="animate-in fade-in-50">
                        {renderTransactionsTable(filterTransactionsBySearch(filterTransactionsByType(transactions.filter(tx => tx.status === 'Failed'))))}
                    </TabsContent>
                     <CardFooter>
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>1-{filterTransactionsBySearch(filterTransactionsByType(transactions)).length}</strong> of <strong>{transactions.length}</strong> transactions
                        </div>
                    </CardFooter>
                 </Card>
            </div>
        </EnhancedTabs>
      </main>
    </DashboardLayout>
  );
}
