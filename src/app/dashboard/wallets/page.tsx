
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Send, ArrowDownLeft, Repeat, ArrowRightLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Image from 'next/image';
import { FundWalletDialog } from '@/components/fund-wallet-dialog';
import { CurrencyExchangeDialog } from '@/components/currency-exchange-dialog';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CreateWalletDialog } from '@/components/create-wallet-dialog';
import { useAuth } from '@/hooks/use-auth';
import { WalletsPageSkeleton } from '@/components/skeletons/wallets-page-skeleton';
import { walletService, currencyService, externalTransactionService, type Account } from '@/services';
import { getFlagCode, getCurrencyName } from '@/utils/currency-meta';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/empty-state';
import { Wallet } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { SUPPORTED_COUNTRIES } from '@/config/kyc-config';

type RecentTransaction = {
  id: string;
  type: string;
  recipientName?: string;
  description?: string;
  amount?: string;
  sendAmount?: string;
  sendCurrency?: string;
  currency?: string;
  status?: string;
  date: string;
  provider?: string;
  source?: 'firebase' | 'external';
};

export default function WalletsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [wallets, setWallets] = useState<Account[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [homeCurrency, setHomeCurrency] = useState<string | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [createWalletDialogOpen, setCreateWalletDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch KYC status from Firestore
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const status = data.kycStatus;
        setIsKycVerified(typeof status === 'string' && status.toLowerCase() === 'verified');
        const inferredHomeCurrency =
          typeof data.homeCurrency === 'string' && data.homeCurrency
            ? data.homeCurrency
            : (typeof data.country === 'string'
                ? (SUPPORTED_COUNTRIES.find((c) => c.iso2 === data.country)?.currency ?? null)
                : null);
        setHomeCurrency(inferredHomeCurrency);
      }
    });

    return () => unsub();
  }, [user]);

  // Fetch wallets from backend
  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoadingWallets(false);
      return;
    }

    const fetchWallets = async () => {
      try {
        const accounts = await walletService.getAccounts();
        // Ensure balance is a number (Prisma Decimal might be serialized as string)
        const normalizedAccounts = accounts.map(account => ({
          ...account,
          balance: typeof account.balance === 'string' ? parseFloat(account.balance) : account.balance,
        }));
        setWallets(normalizedAccounts);
        setLoadingWallets(false);
      } catch (error) {
        console.error('Error fetching wallets:', error);
        toast({
          title: 'Error',
          description: 'Failed to load wallets. Please try again.',
          variant: 'destructive',
        });
        setLoadingWallets(false);
      }
    };

    fetchWallets();
  }, [user, authLoading, toast]);

  // Fetch exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const usdRates = await currencyService.getRates('USD');
        setRates({ USD: 1, ...usdRates });
      } catch (error) {
        console.error('Error fetching rates:', error);
        // Fallback to default rates if API fails
        setRates({
          USD: 1,
          EUR: 1.08,
          GBP: 1.27,
          NGN: 0.00067,
          JPY: 0.0064,
          CAD: 0.73,
          AUD: 0.66,
          GHS: 0.067,
        });
      }
    };

    fetchRates();
  }, []);

  // Fetch recent transactions for the "Recent Activity" section
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoadingTransactions(false);
      return;
    }

    const formatTransactionType = (type: string): string => {
      const typeMap: Record<string, string> = {
        AIRTIME_TOPUP: 'Airtime Top-up',
        DATA_BUNDLE: 'Data Bundle',
        GIFT_CARD: 'Gift Card',
        BILL_PAYMENT: 'Bill Payment',
        PAYMENT: 'Payment',
        PAYOUT: 'Payout',
        VIRTUAL_ACCOUNT_DEPOSIT: 'Deposit',
        WALLET_TRANSFER: 'Transfer',
        CARD_ISSUANCE: 'Card Issuance',
      };
      return typeMap[type] || type;
    };

    const formatStatus = (status: string): string => {
      const statusMap: Record<string, string> = {
        PENDING: 'Pending',
        PROCESSING: 'Pending',
        COMPLETED: 'Completed',
        FAILED: 'Failed',
        CANCELLED: 'Failed',
        REFUNDED: 'Refunded',
      };
      return statusMap[status] || status;
    };

    setLoadingTransactions(true);

    const unsub = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
      try {
        const firebaseRaw = docSnap.exists() ? (docSnap.data().transactions || []) : [];
        const firebaseTransactions: RecentTransaction[] = (Array.isArray(firebaseRaw) ? firebaseRaw : []).map(
          (tx: any, idx: number) => {
            const date = (tx?.date ?? tx?.createdAt ?? tx?.updatedAt ?? new Date().toISOString()).toString();
            const id =
              typeof tx?.id === 'string' && tx.id
                ? tx.id
                : `${user.uid}:${date}:${idx}`;

            return {
              id,
              type: typeof tx?.type === 'string' && tx.type ? tx.type : 'Transaction',
              recipientName: typeof tx?.recipientName === 'string' ? tx.recipientName : undefined,
              description: typeof tx?.description === 'string' ? tx.description : undefined,
              amount: tx?.amount != null ? String(tx.amount) : undefined,
              sendAmount: tx?.sendAmount != null ? String(tx.sendAmount) : undefined,
              sendCurrency:
                typeof tx?.sendCurrency === 'string'
                  ? tx.sendCurrency
                  : typeof tx?.currency === 'string'
                    ? tx.currency
                    : undefined,
              currency: typeof tx?.currency === 'string' ? tx.currency : undefined,
              status: typeof tx?.status === 'string' ? tx.status : undefined,
              date,
              source: 'firebase',
            };
          },
        );

        let externalTransactions: RecentTransaction[] = [];
        try {
          const externalTxs = (await externalTransactionService.getByUser(user.uid, { limit: 10 })) as any;
          const list = Array.isArray(externalTxs) ? externalTxs : (externalTxs?.transactions ?? externalTxs?.data ?? []);

          externalTransactions = (Array.isArray(list) ? list : []).map((tx: any) => ({
            id: String(tx.id),
            type: formatTransactionType(String(tx.type ?? 'Transaction')),
            recipientName:
              tx?.recipientDetails?.billerName ||
              tx?.recipientDetails?.productName ||
              tx?.recipientDetails?.phone ||
              undefined,
            description: typeof tx?.description === 'string' ? tx.description : undefined,
            amount: tx?.amount != null ? String(tx.amount) : undefined,
            sendAmount: tx?.amount != null ? String(tx.amount) : undefined,
            sendCurrency: typeof tx?.currency === 'string' ? tx.currency : undefined,
            currency: typeof tx?.currency === 'string' ? tx.currency : undefined,
            status: tx?.status != null ? formatStatus(String(tx.status)) : undefined,
            date: (tx?.createdAt ?? new Date().toISOString()).toString(),
            provider: typeof tx?.provider === 'string' ? tx.provider : undefined,
            source: 'external',
          }));
        } catch (error) {
          console.error('Failed to fetch external transactions:', error);
        }

        const all = [...firebaseTransactions, ...externalTransactions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);

        setTransactions(all);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        setTransactions([]);
      } finally {
        setLoadingTransactions(false);
      }
    });

    return () => unsub();
  }, [user]);

  const totalBalanceUSD = wallets.reduce((acc, wallet) => {
    const rate = rates[wallet.currency] || 0;
    return acc + (wallet.balance * rate);
  }, 0);

  // Derive view models with flag/name for UI components that expect them
  const walletViews = wallets.map(w => ({
    ...w,
    name: getCurrencyName(w.currency),
    flag: getFlagCode(w.currency),
  }));

  const primaryWallet = walletViews.find(w => w.currency === 'USD') || walletViews[0];
  const otherWallets = primaryWallet ? walletViews.filter(w => w.currency !== primaryWallet.currency) : [];

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleWalletCreated = async () => {
    // Refresh wallets after creation
    try {
      const accounts = await walletService.getAccounts();
      const normalizedAccounts = accounts.map(account => ({
        ...account,
        balance: typeof account.balance === 'string' ? parseFloat(account.balance) : account.balance,
      }));
      setWallets(normalizedAccounts);
      toast({
        title: 'Success',
        description: 'Wallet created successfully!',
      });
    } catch (error) {
      console.error('Error refreshing wallets:', error);
    }
  };

  const isLoading = authLoading || loadingWallets;

  if (isLoading) {
  return <WalletsPageSkeleton language={language} setLanguage={setLanguage} />;
  }

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
              <BreadcrumbPage>Wallets</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-2xl">My Wallets</h1>
          <CreateWalletDialog 
            onWalletCreated={handleWalletCreated} 
            disabled={!isKycVerified}
            existingWallets={wallets}
            requiredCurrencyFirst={homeCurrency ?? undefined}
            enforceRequiredCurrencyFirst={true}
          >
            <Button disabled={!isKycVerified}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Wallet
            </Button>
          </CreateWalletDialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="col-span-1 md:col-span-2 lg:col-span-4">
                 <CardHeader>
                    <CardTitle>Total Estimated Balance</CardTitle>
                    <CardDescription>The combined value of all your currency wallets.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{formatCurrency(totalBalanceUSD, 'USD')}</p>
                    <p className="text-xs text-muted-foreground">Balance is estimated and may vary with exchange rates.</p>
                </CardContent>
            </Card>
        </div>

        {wallets.length === 0 ? (
            <>
                <EmptyState
                    icon={<Wallet className="h-16 w-16" />}
                    title="Start Your Global Journey"
                    description="Create your first currency wallet to send, receive, and manage money across borders instantly. Multi-currency support, instant transfers, and bank-level security."
                    action={
                        isKycVerified
                            ? {
                                label: "Create Your First Wallet",
                                onClick: () => setCreateWalletDialogOpen(true),
                            }
                            : undefined
                    }
                    secondaryAction={
                        !isKycVerified
                            ? {
                                label: "Complete KYC First",
                                onClick: () => window.location.href = '/dashboard/profile',
                                variant: 'outline',
                            }
                            : undefined
                    }
                    size="lg"
                />
                <CreateWalletDialog 
                    onWalletCreated={handleWalletCreated} 
                    disabled={!isKycVerified}
                    open={createWalletDialogOpen}
                    onOpenChange={setCreateWalletDialogOpen}
                    existingWallets={wallets}
                    requiredCurrencyFirst={homeCurrency ?? undefined}
                    enforceRequiredCurrencyFirst={true}
                />
            </>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
                 <Card className="bg-primary text-primary-foreground">
                    <CardHeader>
                         <div className="flex justify-between items-center">
                            <CardTitle>Primary Wallet</CardTitle>
                             <Image 
                                src={`/flag/${primaryWallet.flag.toUpperCase()}.png`}
                                alt={`${primaryWallet.name} flag`}
                                width={32}
                                height={32}
                                className="rounded-full border-2 border-primary-foreground/50 object-cover"
                            />
                        </div>
                        <CardDescription className="text-primary-foreground/80">{primaryWallet.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{formatCurrency(primaryWallet.balance, primaryWallet.currency)}</p>
                    </CardContent>
                    <CardFooter className="grid grid-cols-3 gap-2">
                        <Button variant="secondary" size="sm" asChild>
                            <Link href="/dashboard/payments"><Send className="mr-2 h-4 w-4"/>Send</Link>
                        </Button>
                         <FundWalletDialog wallet={primaryWallet}>
                            <Button variant="secondary" size="sm" className="w-full"><ArrowDownLeft className="mr-2 h-4 w-4"/>Fund</Button>
                        </FundWalletDialog>
                        <CurrencyExchangeDialog wallets={walletViews}>
                          <Button variant="secondary" size="sm" className="w-full"><Repeat className="mr-2 h-4 w-4"/>Exchange</Button>
                        </CurrencyExchangeDialog>
                    </CardFooter>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>All Wallets</CardTitle>
                        <CardDescription>An overview of all your currency balances.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {otherWallets.map(wallet => (
                                <div key={wallet.currency} className="flex items-center p-3 rounded-lg hover:bg-muted/50">
                                    <Image
                                        src={`/flag/${wallet.flag.toUpperCase()}.png`}
                                        alt={`${wallet.name} flag`}
                                        width={24}
                                        height={24}
                                        className="rounded-full mr-3 object-cover"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium">{wallet.currency}</p>
                                    </div>
                                    <div className="text-right font-mono text-sm mr-2">
                                         {formatCurrency(wallet.balance, wallet.currency)}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Send</DropdownMenuItem>
                                            <FundWalletDialog wallet={wallet}>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Fund</DropdownMenuItem>
                                            </FundWalletDialog>
                                            <CurrencyExchangeDialog wallets={walletViews}>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Exchange</DropdownMenuItem>
                                            </CurrencyExchangeDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
             <div className="lg:col-span-1">
                <Card>
                     <CardHeader>
                         <CardTitle>Recent Activity</CardTitle>
                         <CardDescription>Latest transactions across all your wallets.</CardDescription>
                     </CardHeader>
                      <CardContent>
                        {loadingTransactions ? (
                          <p className="text-sm text-muted-foreground">Loading activity...</p>
                        ) : transactions.length > 0 ? (
                             <Table>
                                 <TableHeader>
                                     <TableRow>
                                         <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {transactions.map(tx => (
                                         <TableRow key={tx.id}>
                                             <TableCell className="text-muted-foreground text-xs">{new Date(tx.date).toLocaleDateString()}</TableCell>
                                             <TableCell>
                                                 <div className="font-medium">{tx.recipientName || tx.description}</div>
                                                 <div className="text-xs text-muted-foreground">{tx.type}</div>
                                             </TableCell>
                                             <TableCell className="text-right font-mono">
                                                 <span className={tx.type === 'inflow' ? 'text-green-500' : 'text-destructive'}>
                                                    {formatCurrency(
                                                      Number.parseFloat(String(tx.sendAmount ?? tx.amount ?? '0')) || 0,
                                                      tx.sendCurrency || tx.currency || 'USD'
                                                    )}
                                                 </span>
                                             </TableCell>
                                         </TableRow>
                                     ))}
                                 </TableBody>
                             </Table>
                        ) : (
                            <EmptyState
                                icon={<ArrowRightLeft className="h-8 w-8" />}
                                title="No recent activity"
                                description="Your recent transactions will appear here once you start using your wallets."
                                action={{
                                    label: "View All Transactions",
                                    onClick: () => window.location.href = '/dashboard/transactions',
                                }}
                                showCard={false}
                                size="sm"
                            />
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/dashboard/transactions">View All Transactions</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
        )}
      </main>
    </DashboardLayout>
  );
}
