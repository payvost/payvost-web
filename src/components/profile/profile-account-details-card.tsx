'use client';

import Image from 'next/image';
import { Clock, Copy, Sparkles } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getFlagCode } from '@/utils/currency-meta';
import { useToast } from '@/hooks/use-toast';

interface Props {
  accountDetails: Record<string, Record<string, unknown>>;
  activeWallets: string[];
  walletBalances: Record<string, number>;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function prettyKey(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

export function ProfileAccountDetailsCard({ accountDetails, activeWallets, walletBalances }: Props) {
  const { toast } = useToast();

  const copyDetails = (details: Record<string, unknown>) => {
    const detailsText = Object.entries(details)
      .map(([k, v]) => `${prettyKey(k)}: ${String(v)}`)
      .join('\n');
    navigator.clipboard.writeText(detailsText);
    toast({ title: 'Account details copied' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Account details</CardTitle>
        <CardDescription>Your details for receiving local payments into your wallets.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeWallets[0] || ''} className="w-full">
          <TabsList
            className="grid w-full"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, activeWallets.length)}, minmax(0, 1fr))` }}
          >
            {activeWallets.map((currency) => (
              <TooltipProvider key={currency}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value={currency} className="flex flex-col items-center gap-1 h-auto py-3">
                      <Image
                        src={`/flag/${getFlagCode(currency)}.png`}
                        alt={currency}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span className="text-xs font-medium">{currency}</span>
                      {walletBalances[currency] !== undefined && (
                        <span className="text-[10px] text-muted-foreground">
                          {formatCurrency(walletBalances[currency], currency)}
                        </span>
                      )}
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View {currency} account details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </TabsList>

          {activeWallets.map((currency) => (
            <TabsContent key={currency} value={currency} className="animate-in fade-in-50">
              <div className="mt-4 space-y-3 rounded-md border p-4">
                {accountDetails[currency] ? (
                  <>
                    {Object.entries(accountDetails[currency]).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm gap-4">
                        <span className="text-muted-foreground">{prettyKey(key)}</span>
                        <span className="font-semibold text-right">{String(value)}</span>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => copyDetails(accountDetails[currency])}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy {currency} details
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/30">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 animate-pulse" />
                      </div>
                      <div className="relative flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-primary/60" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Account details pending</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm mb-2">
                      Your {currency} account details are being generated by our partners.
                    </p>
                    <p className="text-xs text-muted-foreground text-center max-w-sm flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      They will appear here once ready
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

