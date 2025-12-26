'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Account } from '@/services';
import { currencyService } from '@/services';

interface WalletSelectorProps {
  accounts: Account[];
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
  billCurrency: string;
  billAmount: number;
}

export function WalletSelector({
  accounts,
  selectedAccountId,
  onSelectAccount,
  billCurrency,
  billAmount,
}: WalletSelectorProps) {
  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
  const needsConversion = selectedAccount?.currency !== billCurrency;

  return (
    <div className="space-y-2">
      <Label htmlFor="source-wallet">Pay from Wallet</Label>
      <Select value={selectedAccountId} onValueChange={onSelectAccount}>
        <SelectTrigger id="source-wallet">
          <SelectValue placeholder="Select wallet" />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center justify-between w-full">
                <span>{account.currency}</span>
                <span className="text-muted-foreground ml-2">
                  {(typeof account.balance === 'number' ? account.balance : parseFloat(String(account.balance || '0')) || 0).toFixed(2)} {account.currency}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedAccount && (
        <Card className="mt-2">
          <CardContent className="pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available balance:</span>
                <span className="font-semibold">
                  {(typeof selectedAccount.balance === 'number' ? selectedAccount.balance : parseFloat(String(selectedAccount.balance || '0')) || 0).toFixed(2)} {selectedAccount.currency}
                </span>
              </div>
              {needsConversion && (
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Currency conversion will be applied
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

