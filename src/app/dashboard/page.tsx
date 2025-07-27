
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { QuickRemit } from '@/components/Qwibik';
import { RecentTransactions } from '@/components/recent-transactions';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Sun, Moon, PlusCircle, FileText, ShieldAlert, CreditCard, ArrowRightLeft, Smartphone, ShoppingCart, Wallet } from 'lucide-react';
import { CurrencyCard } from '@/components/currency-card';
import { AccountCompletion } from '@/components/account-completion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { KycNotification } from '@/components/kyc-notification';


const TransactionChart = dynamic(() => import('@/components/transaction-chart').then(mod => mod.TransactionChart), {
    ssr: false,
    loading: () => <Skeleton className="h-[250px]" />,
});


const currencyBalances = [
  { currency: 'USD', balance: '$1,250.75', growth: '+20.1% from last month', flag: 'us' },
  { currency: 'EUR', balance: '€2,500.50', growth: '+15.5% from last month', flag: 'eu' },
  { currency: 'GBP', balance: '£850.00', growth: '+5.2% from last month', flag: 'gb' },
  { currency: 'NGN', balance: '₦1,850,000.00', growth: '+30.8% from last month', flag: 'ng' },
  { currency: 'JPY', balance: '¥150,000', growth: '-2.1% from last month', flag: 'jp' },
];

const sampleInvoices = [
  { id: 'INV-1235', client: 'Stark Industries', amount: '$10,000.00', status: 'Pending' },
  { id: 'INV-1236', client: 'Wayne Enterprises', amount: '$5,250.75', status: 'Overdue' },
  { id: 'INV-1234', client: 'Acme Inc.', amount: '$2,500.00', status: 'Paid' },
  { id: 'INV-1239', client: 'Gekko & Co', amount: '$8,750.00', status: 'Pending' },
];

const spendingData = [
    { category: 'Transfers', amount: 850, total: 1585, icon: <ArrowRightLeft className="h-5 w-5 text-primary" /> },
    { category: 'Bill Payments', amount: 85, total: 1585, icon: <Smartphone className="h-5 w-5 text-primary" /> },
    { category: 'Card Spending', amount: 450, total: 1585, icon: <ShoppingCart className="h-5 w-5 text-primary" /> },
    { category: 'Gift Cards', amount: 200, total: 1585, icon: <CreditCard className="h-5 w-5 text-primary" /> },
];


interface GreetingState {
  text: string;
  icon: React.ReactNode;
}

export default function DashboardPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] || "User";
  const [filter, setFilter] = useState('Last 30 Days');
  const [hasWallets, setHasWallets] = useState(true); // Set to false to see the empty state
  const [hasTransactionData, setHasTransactionData] = useState(true); // Set to true to see chart
  const [isKycVerified, setIsKycVerified] = useState(false); // Set to false to show notification
  
  const [greeting, setGreeting] = useState<GreetingState | null>(null);

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


  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center gap-2">
           {greeting?.icon}
           <h1 className="text-lg font-semibold md:text-2xl">
                {greeting?.text}, {firstName}!
            </h1>
        </div>

        {!isKycVerified && <KycNotification onDismiss={() => setIsKycVerified(true)} />}

        <div className="relative">
          <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5", !hasWallets && "blur-sm pointer-events-none")}>
              {currencyBalances.slice(0, 4).map((item) => (
                  <CurrencyCard key={item.currency} {...item} />
              ))}
              <Card className="flex flex-col justify-between h-full">
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
          </div>
          {!hasWallets && (
              <div className="absolute inset-0 flex items-center justify-center">
                  <Card className="w-full max-w-sm text-center bg-background/80 backdrop-blur-sm">
                      <CardHeader>
                           <Wallet className="mx-auto h-12 w-12 text-primary" />
                          <CardTitle>Create Your First Wallet</CardTitle>
                          <CardDescription>Get started by adding a currency wallet to your account.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <Button onClick={() => setHasWallets(true)}><PlusCircle className="mr-2 h-4 w-4"/> Add New Wallet</Button>
                      </CardContent>
                  </Card>
              </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-8 items-start">
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
                        <TransactionChart />
                      ) : (
                        <div className="h-[250px] flex flex-col items-center justify-center text-center">
                            <p className="text-muted-foreground">No data for now.</p>
                            <p className="text-sm text-muted-foreground">Check back later once you've made some transactions.</p>
                        </div>
                      )}
                    </CardContent>
                </Card>
                 <RecentTransactions />
            </div>
            <div className="lg:col-span-3 space-y-6">
               <QuickRemit />
               <AccountCompletion />
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-8 items-start">
            <div className="lg:col-span-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Spending Breakdown</CardTitle>
                        <CardDescription>Overview of your spending this month.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {spendingData.map((item) => (
                            <div key={item.category} className="flex items-center gap-4">
                                <div className="p-3 bg-muted rounded-lg">{item.icon}</div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between">
                                        <p className="text-sm font-medium">{item.category}</p>
                                        <p className="text-sm font-mono">${item.amount.toFixed(2)}</p>
                                    </div>
                                    <Progress value={(item.amount / item.total) * 100} className="h-2" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
             <div className="lg:col-span-3 space-y-6">
                 <Card>
                    <CardHeader className="flex flex-row items-center">
                        <div className="grid gap-2">
                            <CardTitle>Invoice Overview</CardTitle>
                            <CardDescription>
                                Recent invoices and their statuses.
                            </CardDescription>
                        </div>
                         <Button asChild size="sm" className="ml-auto gap-1">
                            <Link href="/dashboard/request-payment?tab=invoice">
                                View All
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sampleInvoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell>
                                            <div className="font-medium">{invoice.client}</div>
                                            <div className="text-sm text-muted-foreground hidden md:inline">{invoice.id}</div>
                                        </TableCell>
                                        <TableCell className="text-right">{invoice.amount}</TableCell>
                                        <TableCell className="text-right">
                                             <Badge 
                                                variant={
                                                invoice.status === 'Paid' ? 'default' : 
                                                invoice.status === 'Pending' ? 'secondary' : 'destructive'
                                                }
                                                className="capitalize"
                                            >
                                                {invoice.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                     <CardFooter className="justify-end">
                         <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Invoice
                        </Button>
                    </CardFooter>
                </Card>
                 <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" />Disputes</CardTitle>
                            <CardDescription>Overview of transaction disputes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p><strong className="text-lg">2</strong> cases require your response.</p>
                            <p className="text-sm text-muted-foreground">$1,275.50 is currently under review.</p>
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
