
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Send, ArrowDownLeft, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { abbreviateNumber } from '@/lib/utils';


interface CurrencyCardProps {
  currency: string;
  balance: number;
  growth: string;
  flag: string;
}

const availableFlags = ['US', 'EU', 'GB', 'NG', 'JP'];

export function CurrencyCard({ currency, balance, growth, flag }: CurrencyCardProps) {
  const upperCaseFlag = flag.toUpperCase();
  const flagPath = `/flag/${upperCaseFlag}.png`;
  
  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    JPY: '¥',
  };
  const symbol = currencySymbols[currency] || '$';

  const formattedBalance = balance >= 100000 ? `${symbol}${abbreviateNumber(balance)}` : new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);

  return (
    <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
                <CardTitle className="text-sm font-medium">
                {currency} Balance
                </CardTitle>
                <div className="text-2xl font-bold">{formattedBalance}</div>
                 <div className="flex items-center mt-2 gap-1">
                    <TooltipProvider>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <Link href="/dashboard/payments">
                                    <Send className="h-4 w-4" />
                                    <span className="sr-only">Send</span>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send</TooltipContent>
                     </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <Link href="/dashboard/request-payment">
                                    <ArrowDownLeft className="h-4 w-4" />
                                    <span className="sr-only">Receive</span>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Receive</TooltipContent>
                     </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <Link href="/dashboard/wallets">
                                    <Plus className="h-4 w-4" />
                                    <span className="sr-only">Fund</span>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Fund</TooltipContent>
                     </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
             <div className="relative h-6 w-6">
                <Image 
                    src={flagPath}
                    alt={`${currency} flag`}
                    fill
                    sizes="24px"
                    className="rounded-full object-cover"
                />
            </div>
        </CardHeader>
        <CardContent className="pb-4">
            <p className="text-xs text-muted-foreground">
                {growth}
            </p>
        </CardContent>
    </Card>
  )
}
