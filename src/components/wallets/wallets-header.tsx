'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Repeat2, ArrowDownToLine, Send } from 'lucide-react';
import { CreateWalletDialog } from '@/components/create-wallet-dialog';
import type { Account } from '@/services';

export function WalletsHeader(props: {
  title?: string;
  subtitle?: string;
  isKycVerified: boolean;
  wallets: Account[];
  requiredCurrencyFirst?: string;
  onWalletCreated: () => void;
  onFund: () => void;
  onExchange: () => void;
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
}) {
  const {
    title = 'Wallets',
    subtitle = 'Hold, exchange, and fund multi-currency balances.',
    isKycVerified,
    wallets,
    requiredCurrencyFirst,
    onWalletCreated,
    onFund,
    onExchange,
    createOpen,
    onCreateOpenChange,
  } = props;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
          <Badge variant={isKycVerified ? 'default' : 'secondary'}>
            {isKycVerified ? 'KYC verified' : 'KYC required'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onFund} disabled={!isKycVerified || wallets.length === 0}>
          <ArrowDownToLine className="mr-2 h-4 w-4" />
          Fund
        </Button>
        <Button variant="outline" onClick={onExchange} disabled={!isKycVerified || wallets.length < 2}>
          <Repeat2 className="mr-2 h-4 w-4" />
          Exchange
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard/payments">
            <Send className="mr-2 h-4 w-4" />
            Send
          </a>
        </Button>

        <CreateWalletDialog
          onWalletCreated={onWalletCreated}
          disabled={!isKycVerified}
          open={createOpen}
          onOpenChange={onCreateOpenChange}
          existingWallets={wallets}
          requiredCurrencyFirst={requiredCurrencyFirst}
          enforceRequiredCurrencyFirst={true}
        >
          <Button disabled={!isKycVerified}>
            <Plus className="mr-2 h-4 w-4" />
            Add wallet
          </Button>
        </CreateWalletDialog>
      </div>
    </div>
  );
}
