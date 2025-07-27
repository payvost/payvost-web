
'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Image from 'next/image';


// Placeholder data - in a real app, this would come from an API
const wallets = [
  { currency: 'USD', name: 'US Dollar', balance: 1250.75, flag: 'us', rate: 1 },
  { currency: 'EUR', name: 'Euro', balance: 2500.50, flag: 'eu', rate: 1.08 },
  { currency: 'GBP', name: 'British Pound', balance: 850.00, flag: 'gb', rate: 1.27 },
  { currency: 'NGN', name: 'Nigerian Naira', balance: 1850000.00, flag: 'ng', rate: 0.00067 },
  { currency: 'JPY', name: 'Japanese Yen', balance: 150000, flag: 'jp', rate: 0.0064 },
  { currency: 'CAD', name: 'Canadian Dollar', balance: 1500.00, flag: 'ca', rate: 0.73 },
  { currency: 'AUD', name: 'Australian Dollar', balance: 950.00, flag: 'au', rate: 0.66 },
  { currency: 'GHS', name: 'Ghanaian Cedi', balance: 12500.00, flag: 'gh', rate: 0.067 },
];

const transactions = [
    { id: 'txn_1', type: 'Credit', currency: 'USD', amount: 500, date: '2024-08-15', description: 'From J. Smith' },
    { id: 'txn_2', type: 'Debit', currency: 'USD', amount: -50, date: '2024-08-14', description: 'Netflix Subscription' },
    { id: 'txn_3', type: 'Credit', currency: 'NGN', amount: 50000, date: '2024-08-13', description: 'From A. Adebayo' },
    { id: 'txn_4', type: 'Debit', currency: 'EUR', amount: -100, date: '2024-08-12', description: 'Amazon.de Purchase' },
];


export default function WalletsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  
  const totalBalanceUSD = wallets.reduce((acc, wallet) => {
    return acc + (wallet.balance * wallet.rate);
  }, 0);

  const primaryWallet = wallets.find(w => w.currency === 'USD') || wallets[0];
  const otherWallets = wallets.filter(w => w.currency !== primaryWallet.currency);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
  };


  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-2xl">My Wallets</h1>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Wallet
          </Button>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
                 <Card className="bg-primary text-primary-foreground">
                    <CardHeader>
                         <div className="flex justify-between items-center">
                            <CardTitle>Primary Wallet</CardTitle>
                             <Image 
                                src={`/flags/${primaryWallet.flag.toUpperCase()}.png`}
                                alt={`${primaryWallet.name} flag`}
                                width={32}
                                height={32}
                                className="rounded-full border-2 border-primary-foreground/50"
                            />
                        </div>
                        <CardDescription className="text-primary-foreground/80">{primaryWallet.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{formatCurrency(primaryWallet.balance, primaryWallet.currency)}</p>
                    </CardContent>
                    <CardFooter className="grid grid-cols-3 gap-2">
                        <Button variant="secondary" size="sm"><Send className="mr-2 h-4 w-4"/>Send</Button>
                        <Button variant="secondary" size="sm"><ArrowDownLeft className="mr-2 h-4 w-4"/>Fund</Button>
                        <Button variant="secondary" size="sm"><Repeat className="mr-2 h-4 w-4"/>Exchange</Button>
                    </CardFooter>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>All Wallets</CardTitle>
                        <CardDescription>An overview of all your currency balances.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {otherWallets.map(wallet => (
                                <li key={wallet.currency} className="flex items-center">
                                    <Image 
                                        src={`/flags/${wallet.flag.toUpperCase()}.png`}
                                        alt={`${wallet.name} flag`}
                                        width={24}
                                        height={24}
                                        className="rounded-full mr-3"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium">{wallet.currency}</p>
                                    </div>
                                    <div className="text-right">
                                         <p className="font-mono text-sm">{formatCurrency(wallet.balance, wallet.currency)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
             <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest transactions across all your wallets.</CardDescription>
                    </CardHeader>
                     <CardContent>
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
                                    <TableCell className="text-muted-foreground text-xs">{tx.date}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{tx.description}</div>
                                        <div className="text-xs text-muted-foreground">{tx.type}</div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        <span className={tx.type === 'Credit' ? 'text-green-500' : 'text-destructive'}>
                                            {formatCurrency(tx.amount, tx.currency)}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">View All Transactions</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
