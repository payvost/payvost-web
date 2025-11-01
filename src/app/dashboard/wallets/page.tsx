
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, ArrowRight, DollarSign, Send, ArrowDownLeft, Repeat } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { walletService, currencyService, type Account } from '@/services';
import { useToast } from '@/hooks/use-toast';

export default function WalletsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [wallets, setWallets] = useState<Account[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>({});
  const { toast } = useToast();

  // Fetch wallets from backend
  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoadingWallets(false);
      return;
    }

    const fetchWallets = async () => {
      try {
        const accounts = await walletService.getAccounts();
        setWallets(accounts);
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

  const totalBalanceUSD = wallets.reduce((acc, wallet) => {
    const rate = rates[wallet.currency] || 0;
    return acc + (wallet.balance * rate);
  }, 0);

  const primaryWallet = wallets.find(w => w.currency === 'USD') || wallets[0];
  const otherWallets = primaryWallet ? wallets.filter(w => w.currency !== primaryWallet.currency) : [];

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleWalletCreated = async () => {
    // Refresh wallets after creation
    try {
      const accounts = await walletService.getAccounts();
      setWallets(accounts);
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
    return (
        <DashboardLayout language={language} setLanguage={setLanguage}>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                 <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-36" />
                </div>
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <div className="lg:col-span-1 space-y-6">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-80 w-full" />
                    </div>
                    <div className="lg:col-span-1">
                        <Skeleton className="h-[450px] w-full" />
                    </div>
                </div>
            </main>
        </DashboardLayout>
    )
  }

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-2xl">My Wallets</h1>
          <CreateWalletDialog onWalletCreated={handleWalletCreated} disabled={!isKycVerified}>
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
            <Card>
                <CardContent className="h-96 flex flex-col items-center justify-center text-center">
                    <h3 className="text-2xl font-bold tracking-tight">You haven't created any wallets yet.</h3>
                    <p className="text-sm text-muted-foreground mt-2 mb-6">Click the button below to add your first currency wallet.</p>
                    <CreateWalletDialog onWalletCreated={handleWalletCreated} disabled={!isKycVerified}>
                        <Button disabled={!isKycVerified}><PlusCircle className="mr-2 h-4 w-4"/>Create Your First Wallet</Button>
                    </CreateWalletDialog>
                </CardContent>
            </Card>
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
                        <CurrencyExchangeDialog wallets={wallets}>
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
                                            <CurrencyExchangeDialog wallets={wallets}>
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
                        {transactions.length > 0 ? (
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
                                                    {formatCurrency(parseFloat(tx.sendAmount || tx.amount), tx.sendCurrency || tx.currency)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center text-muted-foreground py-16">
                                <p>No Recent Activity Yet</p>
                            </div>
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
