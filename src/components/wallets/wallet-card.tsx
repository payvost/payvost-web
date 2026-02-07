'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { Account } from '@/services';
import { getCurrencyName, getFlagCode } from '@/utils/currency-meta';
import { ArrowDownToLine, Repeat2, ReceiptText } from 'lucide-react';

function formatMoney(amount: number, currency: string, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(amount);
}

export function WalletCard(props: {
  wallet: Account;
  isPrimary?: boolean;
  onFund: (wallet: Account) => void;
  onExchangeFrom: (wallet: Account) => void;
  onDetails?: (wallet: Account) => void;
}) {
  const { wallet, isPrimary, onFund, onExchangeFrom, onDetails } = props;
  const flag = getFlagCode(wallet.currency).toUpperCase();
  const name = getCurrencyName(wallet.currency);

  return (
    <Card className={isPrimary ? 'border-primary/40' : undefined}>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image
              src={`/flag/${flag}.png`}
              alt={`${wallet.currency} flag`}
              width={28}
              height={28}
              className="rounded-full border object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <div className="font-semibold">{wallet.currency}</div>
                {isPrimary ? <Badge>Primary</Badge> : null}
              </div>
              <div className="text-xs text-muted-foreground">{name}</div>
            </div>
          </div>

          <Badge variant="outline" className="uppercase">
            {wallet.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold tabular-nums">
          {formatMoney(wallet.balance, wallet.currency)}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onFund(wallet)}>
          <ArrowDownToLine className="mr-2 h-4 w-4" />
          Fund
        </Button>
        <Button variant="outline" size="sm" onClick={() => onExchangeFrom(wallet)}>
          <Repeat2 className="mr-2 h-4 w-4" />
          Exchange
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDetails?.(wallet)}>
          <ReceiptText className="mr-2 h-4 w-4" />
          Ledger
        </Button>
      </CardFooter>
    </Card>
  );
}
