'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Send, ArrowDownLeft, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface CurrencyCardProps {
  currency: string;
  balance: number;
  growth: string;
  flag: string;
}

const accentBorderByCurrency: Record<string, string> = {
  USD: 'border-l-slate-900',
  EUR: 'border-l-blue-600',
  GBP: 'border-l-emerald-600',
  NGN: 'border-l-emerald-700',
  JPY: 'border-l-amber-600',
};

export function CurrencyCard({ currency, balance, growth, flag }: CurrencyCardProps) {
  const upperCaseFlag = flag.toUpperCase();
  const flagPath = `/flag/${upperCaseFlag}.png`;

  const normalizedBalance = typeof balance === 'number' ? balance : parseFloat(String(balance));
  const formattedBalance =
    normalizedBalance >= 100000
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          currencyDisplay: 'narrowSymbol',
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        }).format(normalizedBalance || 0)
      : new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          currencyDisplay: 'narrowSymbol',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(normalizedBalance || 0);

  return (
    <Card className={`border-l-4 ${accentBorderByCurrency[currency] ?? 'border-l-primary'} shadow-sm`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-2">
          <CardTitle className="text-sm font-medium">{currency} balance</CardTitle>
          <div className="text-3xl font-semibold tracking-tight">{formattedBalance}</div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/dashboard/payments/send">
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8" asChild>
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
                  <Button variant="outline" size="icon" className="h-8 w-8" asChild>
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
        <div className="relative h-8 w-8 rounded-full border bg-muted p-1">
          <Image
            src={flagPath}
            alt={`${currency} flag`}
            fill
            sizes="32px"
            className="rounded-full object-cover"
          />
        </div>
      </CardHeader>
      <CardContent className="pb-5">
        <p className="text-xs text-muted-foreground">{growth}</p>
      </CardContent>
    </Card>
  );
}
