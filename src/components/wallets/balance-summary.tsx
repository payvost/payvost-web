'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function formatMoney(amount: number, currency: string, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(amount);
}

export function BalanceSummary(props: {
  homeCurrency: string;
  totalEstimated: number | null;
  ratesTimestamp?: string | null;
  loading?: boolean;
}) {
  const { homeCurrency, totalEstimated, ratesTimestamp, loading } = props;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Estimated Total</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="inline-flex items-center text-muted-foreground" aria-label="About estimated total">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Estimated using live rates. Final amounts may vary.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Total value across wallets in {homeCurrency}.
          {ratesTimestamp ? ` Rates updated ${new Date(ratesTimestamp).toLocaleString()}.` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-56" />
        ) : (
          <div className="text-4xl font-bold">
            {totalEstimated == null ? '-' : formatMoney(totalEstimated, homeCurrency)}
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          This number is informational and may differ from executed FX rates and fees.
        </p>
      </CardContent>
    </Card>
  );
}
