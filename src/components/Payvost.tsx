
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRightLeft, Landmark, Users, AtSign, ArrowDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { SendToBankForm } from './send-to-bank-form';
import { SendToUserForm } from './send-to-user-form';
import { PaymentConfirmationDialog } from './payment-confirmation-dialog';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export function Payvost() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [wallets, setWallets] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [sendAmount, setSendAmount] = useState('0.00');
  const [fromWallet, setFromWallet] = useState<string | undefined>(undefined);
  const [amountError, setAmountError] = useState('');
  const [receiveCurrency, setReceiveCurrency] = useState('NGN');
  const [recipientGets, setRecipientGets] = useState('0.00');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string | undefined>(undefined);

  const exchangeRates: Record<string, Record<string, number>> = {
    USD: { NGN: 1450.5, GHS: 14.5, KES: 130.25 },
    EUR: { NGN: 1600.2, GHS: 16.0, KES: 143.5 },
    GBP: { NGN: 1850.75, GHS: 18.5, KES: 165.8 },
    NGN: { USD: 1 / 1450.5, GHS: 14.5 / 1450.5, KES: 130.25 / 1450.5 },
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoadingWallets(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const userWallets = userData.wallets || [];
        setWallets(userWallets);
        setBeneficiaries(userData.beneficiaries || []);
        if (userWallets.length > 0 && !fromWallet) {
          setFromWallet(userWallets[0].currency);
        }
      }
      setLoadingWallets(false);
    });

    return () => unsub();
  }, [user, authLoading, fromWallet]);

  useEffect(() => {
    const selectedWallet = wallets.find((w) => w.currency === fromWallet);
    const amount = parseFloat(sendAmount);

    if (selectedWallet && !isNaN(amount) && amount > selectedWallet.balance) {
      setAmountError('Insufficient balance.');
    } else {
      setAmountError('');
    }
  }, [sendAmount, fromWallet, wallets]);

  useEffect(() => {
    const amount = parseFloat(sendAmount);
    if (
      !isNaN(amount) &&
      amount > 0 &&
      fromWallet &&
      receiveCurrency &&
      exchangeRates[fromWallet] &&
      exchangeRates[fromWallet][receiveCurrency]
    ) {
      const rate = exchangeRates[fromWallet][receiveCurrency];
      const convertedAmount = amount * rate;
      setRecipientGets(convertedAmount.toFixed(2));
    } else {
      setRecipientGets('0.00');
    }
  }, [sendAmount, fromWallet, receiveCurrency]);

  const handleSendMoney = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  const recipientName =
    beneficiaries.find((b) => b.id === selectedBeneficiary)?.name || 'N/A';

  const transactionDetails = {
    sendAmount: parseFloat(sendAmount).toFixed(2),
    sendCurrency: fromWallet || '',
    recipientGets: recipientGets,
    recipientCurrency: receiveCurrency,
    recipientName: recipientName,
    exchangeRate: `1 ${fromWallet} = ${
      exchangeRates[fromWallet || 'USD']?.[receiveCurrency] || 0
    } ${receiveCurrency}`,
    fee: '$5.00', // This should be dynamic
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const isButtonDisabled =
    isLoading ||
    !!amountError ||
    parseFloat(sendAmount) <= 0 ||
    !selectedBeneficiary;
  const currentRate =
    fromWallet && receiveCurrency && exchangeRates[fromWallet]?.[receiveCurrency]
      ? `1 ${fromWallet} = ${exchangeRates[fromWallet][receiveCurrency]} ${receiveCurrency}`
      : 'Not available';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Money</CardTitle>
        <CardDescription>
          Choose a recipient and send money in just a few clicks.
        </CardDescription>
      </CardHeader>
      <Tabs defaultValue="beneficiary">
        <CardContent className="pb-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="beneficiary">
              <Users className="mr-2 h-4 w-4" />
              To Beneficiary
            </TabsTrigger>
            <TabsTrigger value="bank">
              <Landmark className="mr-2 h-4 w-4" />
              Send to Bank
            </TabsTrigger>
            <TabsTrigger value="user">
              <AtSign className="mr-2 h-4 w-4" />
              Send to User
            </TabsTrigger>
          </TabsList>
        </CardContent>
        <TabsContent value="beneficiary">
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Select
                value={selectedBeneficiary}
                onValueChange={setSelectedBeneficiary}
              >
                <SelectTrigger id="recipient">
                  <SelectValue placeholder="Select a saved recipient" />
                </SelectTrigger>
                <SelectContent>
                  {beneficiaries.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.bank} ••••{b.accountLast4})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-wallet">From Wallet</Label>
                {loadingWallets ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={fromWallet} onValueChange={setFromWallet}>
                    <SelectTrigger id="from-wallet">
                      <SelectValue placeholder="Select a wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem
                          key={wallet.currency}
                          value={wallet.currency}
                        >
                          {wallet.currency} Wallet ({formatCurrency(
                            wallet.balance,
                            wallet.currency
                          )})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="send-amount">You send</Label>
                <Input
                  id="send-amount"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                />
                {amountError && (
                  <p className="text-sm text-destructive">{amountError}</p>
                )}
              </div>
            </div>

            <div className="flex justify-center items-center my-4">
              <div className="w-full border-t border-dashed"></div>
              <ArrowDown className="h-5 w-5 text-muted-foreground mx-4" />
              <div className="w-full border-t border-dashed"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient-currency">Recipient Currency</Label>
                <Select
                  value={receiveCurrency}
                  onValueChange={setReceiveCurrency}
                >
                  <SelectTrigger id="recipient-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                    <SelectItem value="GHS">Ghanaian Cedi (GHS)</SelectItem>
                    <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient-gets">Recipient gets</Label>
                <Input
                  id="recipient-gets"
                  value={recipientGets}
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note / Reference (Optional)</Label>
              <Input id="note" placeholder="e.g., For school fees" />
            </div>

            <div className="text-sm text-muted-foreground pt-2">
              <p>
                Exchange rate: {currentRate} | Fee: $5.00
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <PaymentConfirmationDialog
              onConfirm={handleSendMoney}
              transactionDetails={transactionDetails}
              isLoading={isLoading}
            >
              <Button className="w-full" disabled={isButtonDisabled}>
                Send Money
              </Button>
            </PaymentConfirmationDialog>
          </CardFooter>
        </TabsContent>
        <TabsContent value="bank">
          <CardContent className="space-y-4 pt-4">
            <SendToBankForm />
          </CardContent>
          <CardFooter>
            <PaymentConfirmationDialog
              onConfirm={handleSendMoney}
              transactionDetails={{
                ...transactionDetails,
                recipientName: 'New Bank Recipient',
              }}
              isLoading={isLoading}
            >
              <Button className="w-full" disabled={isLoading}>
                Continue to Transfer
              </Button>
            </PaymentConfirmationDialog>
          </CardFooter>
        </TabsContent>
        <TabsContent value="user">
          <CardContent className="space-y-4 pt-4">
            <SendToUserForm />
          </CardContent>
          <CardFooter>
            <PaymentConfirmationDialog
              onConfirm={handleSendMoney}
              transactionDetails={{
                ...transactionDetails,
                recipientName: 'Payvost User',
              }}
              isLoading={isLoading}
            >
              <Button className="w-full" disabled={isLoading}>
                Send to User
              </Button>
            </PaymentConfirmationDialog>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
