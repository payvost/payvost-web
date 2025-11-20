
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Payvost } from '@/components/Payvost';
import { RecentTransactions } from '@/components/recent-transactions';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Sun, Moon, PlusCircle, FileText, ShieldAlert, CreditCard, ArrowRightLeft, Smartphone, ShoppingCart, Wallet, LineChart, CheckCircle, Users } from 'lucide-react';
import { CurrencyCard } from '@/components/currency-card';
import { getFlagCode } from '@/utils/currency-meta';
import { AccountCompletion } from '@/components/account-completion';
import { cn, abbreviateNumber } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { KycNotification } from '@/components/kyc-notification';
import { DashboardLoadingSkeleton, WalletCardSkeleton } from '@/components/skeletons/dashboard-skeleton';
import { CreateWalletDialog } from '@/components/create-wallet-dialog';
import { db } from '@/lib/firebase';
import { TransactionPinSetupDialog } from '@/components/transaction-pin-setup-dialog';
import { doc, onSnapshot, Timestamp, collection, query, orderBy, limit, where, addDoc, serverTimestamp, DocumentData, updateDoc, type DocumentSnapshot, type QuerySnapshot, type FirestoreError } from 'firebase/firestore';
import { InvoiceAPI, type Invoice } from '@/services/invoice-api';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { externalTransactionService } from '@/services';


const TransactionChart = dynamic(() => import('@/components/transaction-chart').then(mod => mod.TransactionChart), {
    ssr: false,
    loading: () => <Skeleton className="h-[250px]" />,
});

const defaultSpendingData = [
    { category: 'Transfers', amount: 0, total: 1, icon: <ArrowRightLeft className="h-5 w-5 text-primary" /> },
    { category: 'Bill Payments', amount: 0, total: 1, icon: <Smartphone className="h-5 w-5 text-primary" /> },
];

const kpiCards = [
    { title: "Total Volume", value: 12500, change: "+15.2% vs last month", icon: <LineChart className="h-4 w-4 text-muted-foreground" />, currency: 'USD' },
    { title: "Successful Payouts", value: 420, change: "+35 vs last month", icon: <CheckCircle className="h-4 w-4 text-muted-foreground" /> },
    { title: "Active Customers", value: 87, change: "+5 new this month", icon: <Users className="h-4 w-4 text-muted-foreground" /> },
    { title: "Pending Invoices", value: 4, change: "$12,500 outstanding", icon: <FileText className="h-4 w-4 text-muted-foreground" /> },
];


interface GreetingState {
  text: string;
  icon: React.ReactNode;
}

interface MonthlyData {
    month: string;
    income: number;
    expense: number;
}

export default function DashboardPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user, loading: authLoading } = useAuth();
  const [wallets, setWallets] = useState<any[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [greeting, setGreeting] = useState<GreetingState | null>(null);
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [spendingData, setSpendingData] = useState(defaultSpendingData);
  const [hasTransactionData, setHasTransactionData] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [disputes, setDisputes] = useState<DocumentData[]>([]);
  const [loadingDisputes, setLoadingDisputes] = useState(true);
  const [externalTxStats, setExternalTxStats] = useState({ total: 0, completed: 0, pending: 0, failed: 0, totalAmount: 0 });
    const [needsPin, setNeedsPin] = useState(false);
    const [pinDialogOpen, setPinDialogOpen] = useState(false);
  
  const firstName = user?.displayName?.split(' ')[0] || "User";
  const [filter, setFilter] = useState('Last 30 Days');

    const processTransactionsForSpending = (transactions: any[]) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthlySpending = transactions
        .filter(tx => {
            const txDate = tx.createdAt instanceof Timestamp ? tx.createdAt.toDate() : new Date(tx.date);
            return tx.type !== 'inflow' && txDate.getMonth() === thisMonth && txDate.getFullYear() === thisYear;
        })
        .reduce((acc, tx) => {
            const category = tx.type === 'Transfer' ? 'Transfers' : 'Bill Payments';
            const amount = parseFloat(tx.sendAmount || tx.amount || '0');
            acc[category] = (acc[category] || 0) + amount;
            return acc;
        }, {} as Record<string, number>);

    const totalSpent = (Object.values(monthlySpending) as number[]).reduce((sum: number, amount: number) => sum + amount, 0);

    const newSpendingData: { category: string; amount: number; total: number; icon: React.JSX.Element }[] = [
      { category: 'Transfers', amount: monthlySpending['Transfers'] || 0, total: totalSpent || 1, icon: <ArrowRightLeft className="h-5 w-5 text-primary" /> },
      { category: 'Bill Payments', amount: monthlySpending['Bill Payments'] || 0, total: totalSpent || 1, icon: <Smartphone className="h-5 w-5 text-primary" /> },
    ];
    setSpendingData(newSpendingData);
  }

  // Fetch external transaction statistics
  useEffect(() => {
    if (!user) return;

    const fetchExternalStats = async () => {
      try {
        const stats = await externalTransactionService.getStats(user.uid);
        setExternalTxStats(stats as { total: number; completed: number; pending: number; failed: number; totalAmount: number });
      } catch (error) {
        console.error('Failed to fetch external transaction stats:', error);
      }
    };

    fetchExternalStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchExternalStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user || !user.email) {
      setLoadingWallets(false);
      setLoadingInvoices(false);
      setLoadingDisputes(false);
      return;
    }
  
        const userDocRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userDocRef, async (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setWallets(data.wallets || []);
        
    const newKycStatus = data.kycStatus;
    const normalizedKycStatus = typeof newKycStatus === 'string' ? newKycStatus.toLowerCase() : 'unverified';
        const newBusinessStatus = data.businessProfile?.status;
        const welcomeNotificationSent = data.welcomeNotificationSent || {};
  
        // Welcome notification for personal KYC
    if (normalizedKycStatus === 'verified' && !welcomeNotificationSent.personal && user.displayName) {
            console.log("User KYC verified, sending welcome notification.");
            try {
                await addDoc(collection(db, "users", user.uid, "notifications"), {
                    icon: 'kyc', title: 'Account Verified!',
                    description: 'Congratulations! Your account has been verified. You now have full access to all features.',
                    date: serverTimestamp(), read: false, href: '/dashboard/profile', context: 'personal'
                });
                await updateDoc(userDocRef, { 'welcomeNotificationSent.personal': true });
            } catch (error) {
                console.error("Failed to send welcome notification:", error);
            }
        }
        
        // Welcome notification for Business Approval
        if (newBusinessStatus === 'Approved' && !welcomeNotificationSent.business && user.displayName) {
            console.log("Business profile approved, sending notification.");
            try {
                 await addDoc(collection(db, "users", user.uid, "notifications"), {
                    icon: 'success', title: 'Business Account Approved!',
                    description: `Congratulations! Your business "${data.businessProfile.name}" has been approved. You can now switch to your business dashboard.`,
                    date: serverTimestamp(), read: false, href: '/business', context: 'business'
                });
                await updateDoc(userDocRef, { 'welcomeNotificationSent.business': true });
            } catch (error) {
                console.error("Failed to send business approval notification:", error);
            }
        }
        
    setIsKycVerified(normalizedKycStatus === 'verified');

    // Check if transaction PIN is set
    const hasPin = Boolean(data.transactionPinHash);
    setNeedsPin(!hasPin);
    setPinDialogOpen(!hasPin);
  
        const transactions = data.transactions || [];
        if (transactions.length > 0) {
            setHasTransactionData(true);
            const monthlySummary = processTransactionsForChart(transactions);
            setChartData(monthlySummary);
            processTransactionsForSpending(transactions);
        } else {
            setHasTransactionData(false);
            setChartData([]);
            setSpendingData(defaultSpendingData);
        }
      }
      setLoadingWallets(false);
    },
    (error) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoadingWallets(false);
    });
    
    // Fetch invoices using API
    const fetchInvoices = async () => {
        try {
            const result = await InvoiceAPI.listInvoices({ limit: 4 });
            setInvoices(result.invoices);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setInvoices([]);
        } finally {
            setLoadingInvoices(false);
        }
    };

    fetchInvoices();
    
    // Poll for updates every 30 seconds
    const unsubInvoices = setInterval(fetchInvoices, 30000);

    const disputesQuery = query(collection(db, "disputes"), where("userId", "==", user.uid));
    const unsubDisputes = onSnapshot(disputesQuery, (snapshot) => {
        const fetchedDisputes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDisputes(fetchedDisputes);
        setLoadingDisputes(false);
    }, (error) => {
        console.error("Error fetching disputes:", error);
        setLoadingDisputes(false);
    });


    return () => {
        unsubUser();
        clearInterval(unsubInvoices);
        unsubDisputes();
    };
  }, [user, authLoading]);

  const processTransactionsForChart = (transactions: any[]): MonthlyData[] => {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        const monthlyData: { [key: string]: { income: number; expense: number } } = {};

        // Initialize last 6 months
        for (let i = 0; i < 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }

        transactions.forEach(tx => {
            const txDate = tx.createdAt instanceof Timestamp ? tx.createdAt.toDate() : new Date(tx.date);
            if (txDate >= sixMonthsAgo) {
                const monthKey = `${txDate.getFullYear()}-${txDate.getMonth()}`;
                const amount = parseFloat(tx.sendAmount || tx.amount || '0');
                if (tx.type === 'inflow') {
                    monthlyData[monthKey].income += amount;
                } else if (tx.type === 'outflow' || tx.type === 'Transfer' || tx.type === 'Bill Payment') {
                    monthlyData[monthKey].expense += amount;
                }
            }
        });

        const chartData = Object.keys(monthlyData).map(key => {
            const [year, month] = key.split('-').map(Number);
            return {
                month: monthNames[month],
                income: monthlyData[key].income,
                expense: monthlyData[key].expense,
                date: new Date(year, month)
            };
        }).sort((a, b) => a.date.getTime() - b.date.getTime());

        return chartData;
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting({ text: "Good Morning", icon: <Sun className="h-6 w-6 text-yellow-500" /> });
    } else if (hour < 18) {
      setGreeting({ text: "Good Afternoon", icon: <Sun className="h-6 w-6 text-orange-500" /> });
    } else {
      setGreeting({ text: "Good Evening", icon: <Moon className="h-6 w-6 text-blue-400" /> });
    }
  }, []);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const formatValue = (value: number, currency?: string) => {
    if (currency) {
        return `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value)}`;
    }
    return abbreviateNumber(value);
  }
  
  const handleWalletCreated = () => {
    // Real-time listener will update the state automatically
  }

        // Prevent flash of incorrect data by waiting for all data to load
        const isLoading = authLoading || loadingWallets || loadingDisputes;
  const hasWallets = wallets.length > 0;
  const showCreateWalletCTA = wallets.length < 4;

  const renderWalletCards = () => {
    if (isLoading) {
                return (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
                                 {Array.from({ length: 2 }).map((_, i) => (
                                        <WalletCardSkeleton key={i} />
                                    ))}
                        </div>
                )
    }

    if (!hasWallets) {
        return (
            <div className="w-full lg:hidden">
                <Card className="border-2 border-dashed">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-4 max-w-xl mx-auto">
                            {/* Icon */}
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Wallet className="h-8 w-8 text-primary" />
                            </div>
                            
                            {/* Heading */}
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold">
                                    Start Your Global Journey
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    Create your first currency wallet to send, receive, and manage money across borders instantly.
                                </CardDescription>
                            </div>

                            {/* Benefits Grid */}
                            <div className="grid grid-cols-3 gap-2 w-full mt-2">
                                <div className="flex flex-col items-center p-2 rounded border border-border/50">
                                    <ArrowRightLeft className="h-4 w-4 text-primary mb-1" />
                                    <h4 className="font-semibold text-xs mb-0.5">Instant</h4>
                                    <p className="text-[10px] text-muted-foreground text-center leading-tight">Send globally</p>
                                </div>
                                <div className="flex flex-col items-center p-2 rounded border border-border/50">
                                    <LineChart className="h-4 w-4 text-primary mb-1" />
                                    <h4 className="font-semibold text-xs mb-0.5">Multi-Currency</h4>
                                    <p className="text-[10px] text-muted-foreground text-center leading-tight">Hold multiple</p>
                                </div>
                                <div className="flex flex-col items-center p-2 rounded border border-border/50">
                                    <ShieldAlert className="h-4 w-4 text-primary mb-1" />
                                    <h4 className="font-semibold text-xs mb-0.5">Secure</h4>
                                    <p className="text-[10px] text-muted-foreground text-center leading-tight">Bank-level</p>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <div className="pt-2">
                                <CreateWalletDialog onWalletCreated={handleWalletCreated} disabled={!isKycVerified}>
                                    <Button 
                                        size="default" 
                                        disabled={!isKycVerified}
                                        className="w-full"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Create Your First Wallet
                                    </Button>
                                </CreateWalletDialog>
                                {!isKycVerified && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Complete KYC verification to create a wallet
                                    </p>
                                )}
                            </div>

                            {/* Popular currencies hint */}
                            <div className="pt-1">
                                <p className="text-xs text-muted-foreground mb-1.5">Popular: </p>
                                <div className="flex flex-wrap justify-center gap-1.5">
                                    {['USD', 'EUR', 'GBP', 'NGN'].map((currency) => (
                                        <Badge key={currency} variant="secondary" className="text-xs py-0.5 px-2">
                                            {currency}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const cards = wallets.map(wallet => (
        <CarouselItem key={wallet.currency} className="md:basis-1/2 lg:basis-1/3">
             <CurrencyCard currency={wallet.currency} balance={wallet.balance} growth="+0.0%" flag={getFlagCode(wallet.currency)} />
        </CarouselItem>
    ));

    if (showCreateWalletCTA) {
        cards.push(
             <CarouselItem key="create-wallet-cta" className="md:basis-1/2 lg:basis-1/3">
                <Card className="flex flex-col justify-center items-center h-full min-h-[200px] border-dashed p-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-full">
                           <Wallet className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 text-left">
                            <CardTitle className="text-base mb-1">Add Wallet</CardTitle>
                            <CardDescription className="text-xs">Add more currencies to hold.</CardDescription>
                        </div>
                    </div>
                     <CreateWalletDialog onWalletCreated={handleWalletCreated} disabled={!isKycVerified}>
                        <Button size="sm" variant="outline" className="w-full mt-4" disabled={!isKycVerified}><PlusCircle className="mr-2 h-4 w-4"/> Add New</Button>
                    </CreateWalletDialog>
                </Card>
             </CarouselItem>
        );
    }
    
    return (
        <div className="lg:hidden">
            <Carousel setApi={setApi} className="w-full">
                <CarouselContent>
                    {cards}
                </CarouselContent>
            </Carousel>
            <div className="py-2 flex justify-center gap-2">
                {Array.from({ length: count }).map((_, i) => (
                    <Button
                        key={i}
                        variant="ghost"
                        size="icon"
                        className={cn("h-2 w-2 rounded-full p-0", i === current -1 ? "bg-primary" : "bg-muted-foreground/50")}
                        onClick={() => api?.scrollTo(i)}
                    />
                ))}
            </div>
        </div>
    );
  }
  
  const renderDesktopWalletCards = () => {
    // If no wallets, return empty state (handled by renderWalletCards for mobile, but desktop needs it too)
    if (!hasWallets) {
        return null; // Desktop empty state is handled in the main render
    }
    
    const cards = [];
    wallets.slice(0, 4).forEach(wallet => {
        cards.push(<CurrencyCard key={wallet.currency} currency={wallet.currency} balance={wallet.balance} growth="+0.0%" flag={getFlagCode(wallet.currency)} />);
    });
    if (hasWallets) {
        cards.push(
            <Card key="all-wallets" className="flex flex-col justify-between h-full">
                <CardHeader className="pb-2 pt-6 px-6 text-center">
                    <CardTitle className="text-sm font-medium">All Wallets</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-grow flex flex-col justify-center items-center">
                    <p className="text-muted-foreground text-xs text-center">View all your currency balances in one place.</p>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                    <Button asChild className="w-full">
                        <Link href="/dashboard/wallets">View All Wallets <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    }
    if (showCreateWalletCTA && hasWallets) {
        cards.push(
             <Card key="create-wallet-cta" className="flex flex-col justify-center items-center h-full border-dashed">
                <CardContent className="p-6 text-center">
                    <Wallet className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <CardTitle className="text-base mb-1">Expand Your Reach</CardTitle>
                    <CardDescription className="text-xs mb-4">Add more currencies to transact globally.</CardDescription>
                     <CreateWalletDialog onWalletCreated={handleWalletCreated} disabled={!isKycVerified}>
                        <Button size="sm" variant="outline" disabled={!isKycVerified}><PlusCircle className="mr-2 h-4 w-4"/> Add New Wallet</Button>
                    </CreateWalletDialog>
                </CardContent>
            </Card>
        )
    }
    return cards;
  }

  const disputesRequiringResponse = disputes.filter(d => d.status === 'Needs response').length;
  const amountUnderReview = disputes
    .filter(d => ['Needs response', 'Under review'].includes(d.status))
    .reduce((sum, d) => sum + d.amount, 0);
    // Show comprehensive loading skeleton to prevent flash of incorrect state
    if (isLoading) {
        return (
            <DashboardLayout language={language} setLanguage={setLanguage}>
                <DashboardLoadingSkeleton />
            </DashboardLayout>
        );
    }


  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center gap-2">
           {greeting?.icon}
           <h1 className="text-lg font-semibold md:text-2xl">
                {greeting?.text}, {firstName}!
            </h1>
        </div>

                {!isKycVerified && !isLoading && <KycNotification onDismiss={() => {}} />}
                {user && (
                    <TransactionPinSetupDialog
                        userId={user.uid}
                        open={pinDialogOpen}
                        onOpenChange={setPinDialogOpen}
                        onCompleted={() => setPinDialogOpen(false)}
                        force={false}
                    />
                )}

        {/* Mobile wallet cards */}
        {renderWalletCards()}
        
        {/* Desktop wallet cards */}
        <div className="hidden lg:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {!hasWallets ? (
                // Desktop empty state - spans full width
                <div className="col-span-5">
                    <Card className="border-2 border-dashed">
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center text-center space-y-4 max-w-xl mx-auto">
                                {/* Icon */}
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <Wallet className="h-8 w-8 text-primary" />
                                </div>
                                
                                {/* Heading */}
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-bold">
                                        Start Your Global Journey
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        Create your first currency wallet to send, receive, and manage money across borders instantly.
                                    </CardDescription>
                                </div>

                                {/* Benefits Grid */}
                                <div className="grid grid-cols-3 gap-2 w-full mt-2">
                                    <div className="flex flex-col items-center p-2 rounded border border-border/50">
                                        <ArrowRightLeft className="h-4 w-4 text-primary mb-1" />
                                        <h4 className="font-semibold text-xs mb-0.5">Instant</h4>
                                        <p className="text-[10px] text-muted-foreground text-center leading-tight">Send globally</p>
                                    </div>
                                    <div className="flex flex-col items-center p-2 rounded border border-border/50">
                                        <LineChart className="h-4 w-4 text-primary mb-1" />
                                        <h4 className="font-semibold text-xs mb-0.5">Multi-Currency</h4>
                                        <p className="text-[10px] text-muted-foreground text-center leading-tight">Hold multiple</p>
                                    </div>
                                    <div className="flex flex-col items-center p-2 rounded border border-border/50">
                                        <ShieldAlert className="h-4 w-4 text-primary mb-1" />
                                        <h4 className="font-semibold text-xs mb-0.5">Secure</h4>
                                        <p className="text-[10px] text-muted-foreground text-center leading-tight">Bank-level</p>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <div className="pt-2">
                                    <CreateWalletDialog onWalletCreated={handleWalletCreated} disabled={!isKycVerified}>
                                        <Button 
                                            size="default" 
                                            disabled={!isKycVerified}
                                            className="w-full"
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Create Your First Wallet
                                        </Button>
                                    </CreateWalletDialog>
                                    {!isKycVerified && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Complete KYC verification to create a wallet
                                        </p>
                                    )}
                                </div>

                                {/* Popular currencies hint */}
                                <div className="pt-1">
                                    <p className="text-xs text-muted-foreground mb-1.5">Popular: </p>
                                    <div className="flex flex-wrap justify-center gap-1.5">
                                        {['USD', 'EUR', 'GBP', 'NGN'].map((currency) => (
                                            <Badge key={currency} variant="secondary" className="text-xs py-0.5 px-2">
                                                {currency}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                renderDesktopWalletCards()
            )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-8">
             <div className="lg:col-span-4 space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Overview</CardTitle>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8">
                                    {filter}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setFilter('Last 30 Days')}>Last 30 Days</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilter('Last 60 Days')}>Last 60 Days</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilter('Last 90 Days')}>Last 90 Days</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent className="pl-2">
                      {hasTransactionData ? (
                        <TransactionChart data={chartData} />
                      ) : (
                        <div className="h-[250px] flex flex-col items-center justify-center text-center">
                            <p className="text-muted-foreground">We are still propagating your data.</p>
                            <p className="text-sm text-muted-foreground">Your transaction chart will appear here once you have enough activity.</p>
                        </div>
                      )}
                    </CardContent>
                </Card>
                <RecentTransactions />
                <Card>
                    <CardHeader>
                        <CardTitle>Spending Breakdown</CardTitle>
                        <CardDescription>Overview of your spending this month.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!hasTransactionData ? (
                            <div className="text-center py-10 text-muted-foreground">No spending data for this month yet.</div>
                        ) : spendingData.map((item) => (
                            <div key={item.category} className="flex items-center gap-4">
                                <div className="p-3 bg-muted rounded-lg">{item.icon}</div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between">
                                        <p className="text-sm font-medium">{item.category}</p>
                                        <p className="text-sm font-mono">${item.amount.toFixed(2)}</p>
                                    </div>
                                    <Progress value={item.total > 0 ? (item.amount / item.total) * 100 : 0} className="h-2" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Partner Transactions</CardTitle>
                        <CardDescription>Activity from Reloadly, Rapyd, and other partners.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {externalTxStats.total === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">No partner transactions yet.</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Total Transactions</p>
                                        <p className="text-2xl font-bold">{externalTxStats.total}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Total Amount</p>
                                        <p className="text-2xl font-bold">${externalTxStats.totalAmount.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                            <span className="text-sm">Completed</span>
                                        </div>
                                        <span className="text-sm font-medium">{externalTxStats.completed}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                                            <span className="text-sm">Pending</span>
                                        </div>
                                        <span className="text-sm font-medium">{externalTxStats.pending}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                            <span className="text-sm">Failed</span>
                                        </div>
                                        <span className="text-sm font-medium">{externalTxStats.failed}</span>
                                    </div>
                                </div>
                                <Button asChild variant="outline" className="w-full mt-4">
                                    <Link href="/dashboard/transactions">
                                        View All Transactions
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-3 space-y-6">
               <Payvost />
               <AccountCompletion />
                 <Card>
                    <CardHeader className="flex flex-row items-center">
                        <div className="grid gap-2">
                            <CardTitle>Invoice Overview</CardTitle>
                            <CardDescription>
                                Recent invoices and their statuses.
                            </CardDescription>
                        </div>
                         <Button asChild size="sm" className="ml-auto gap-1" disabled={!isKycVerified}>
                            <Link href="/dashboard/request-payment?tab=invoice">
                                View All
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                         {loadingInvoices ? (
                            <div className="space-y-2">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                            </div>
                         ) : invoices.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground text-sm">No recent invoices.</div>
                         ) : (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell>
                                                <div className="font-medium">{invoice.toInfo.name}</div>
                                                <div className="text-sm text-muted-foreground hidden md:inline">{invoice.invoiceNumber}</div>
                                            </TableCell>
                                            <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(Number(invoice.grandTotal))}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge 
                                                    variant={
                                                    invoice.status === 'PAID' ? 'default' : 
                                                    invoice.status === 'PENDING' ? 'secondary' : 'destructive'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {invoice.status === 'PAID' ? 'Paid' : 
                                                     invoice.status === 'PENDING' ? 'Pending' : 
                                                     invoice.status === 'OVERDUE' ? 'Overdue' : 'Draft'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         )}
                    </CardContent>
                     <CardFooter className="justify-end">
                         <Button asChild disabled={!isKycVerified}>
                            <Link href="/dashboard/request-payment?tab=invoice&create=true">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Invoice
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" />Disputes</CardTitle>
                        <CardDescription>Overview of transaction disputes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {loadingDisputes ? (
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ) : (
                            <>
                                <p><strong className="text-lg">{disputesRequiringResponse}</strong> cases require your response.</p>
                                <p className="text-sm text-muted-foreground">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountUnderReview)} is currently under review.</p>
                            </>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/dispute">View All Disputes</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
