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

const gradients: Record<string, string> = {
  USD: 'from-slate-900 via-slate-900 to-slate-800',
  EUR: 'from-indigo-900 via-indigo-800 to-blue-700',
  GBP: 'from-emerald-900 via-emerald-800 to-teal-700',
  NGN: 'from-emerald-900 via-green-800 to-emerald-700',
  JPY: 'from-amber-900 via-orange-800 to-amber-700',
};

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

  const normalizedBalance = typeof balance === 'number' ? balance : parseFloat(String(balance));
  const formattedBalance = normalizedBalance >= 100000
    ? `${symbol}${abbreviateNumber(normalizedBalance)}`
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(normalizedBalance || 0);

  return (
    <Card className={`relative overflow-hidden border-0 text-white shadow-lg bg-gradient-to-br ${gradients[currency] ?? 'from-slate-900 to-slate-800'}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_35%)]" />
      <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-2">
          <CardTitle className="text-sm font-medium text-white/80">{currency} balance</CardTitle>
          <div className="text-3xl font-semibold tracking-tight">{formattedBalance}</div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/15 text-white hover:bg-white/25" asChild>
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
                  <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/15 text-white hover:bg-white/25" asChild>
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
                  <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/15 text-white hover:bg-white/25" asChild>
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
        <div className="relative h-8 w-8 rounded-full border border-white/30 bg-white/10 p-1">
          <Image
            src={flagPath}
            alt={`${currency} flag`}
            fill
            sizes="32px"
            className="rounded-full object-cover"
          />
        </div>
      </CardHeader>
      <CardContent className="relative pb-5">
        <p className="text-xs text-white/70">{growth}</p>
      </CardContent>
    </Card>
  );
}
