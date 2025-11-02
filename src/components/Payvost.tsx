
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
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { walletService, transactionService, currencyService, type Account } from '@/services';

export function Payvost() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [wallets, setWallets] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [sendAmount, setSendAmount] = useState('0.00');
  const [fromWallet, setFromWallet] = useState<string | undefined>(undefined);
  const [amountError, setAmountError] = useState('');
  const [receiveCurrency, setReceiveCurrency] = useState('NGN');
  const [recipientGets, setRecipientGets] = useState('0.00');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string | undefined>(undefined);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const { toast } = useToast();

  // Fetch wallets from backend
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoadingData(false);
      return;
    }

    const fetchData = async () => {
      try {
        const accounts = await walletService.getAccounts();
        setWallets(accounts);
        // TODO: Fetch beneficiaries from backend when endpoint is available
        // For now, beneficiaries still come from Firebase
        if (accounts.length > 0 && !fromWallet) {
          setFromWallet(accounts[0].currency);
        }
        setLoadingData(false);
      } catch (error) {
        console.error('Error fetching wallets:', error);
        setLoadingData(false);
      }
    };

    fetchData();
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

  // Fetch exchange rate when currencies change
  useEffect(() => {
    const fetchRate = async () => {
      if (!fromWallet || !receiveCurrency || fromWallet === receiveCurrency) {
        setExchangeRate(1);
        return;
      }

      try {
        const rate = await currencyService.getRate(fromWallet, receiveCurrency);
        setExchangeRate(rate);
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Fallback to default rates
        const fallbackRates: Record<string, Record<string, number>> = {
          USD: { NGN: 1450.5, GHS: 14.5, KES: 130.25 },
          EUR: { NGN: 1600.2, GHS: 16.0, KES: 143.5 },
          GBP: { NGN: 1850.75, GHS: 18.5, KES: 165.8 },
        };
        setExchangeRate(fallbackRates[fromWallet]?.[receiveCurrency] || 0);
      }
    };

    fetchRate();
  }, [fromWallet, receiveCurrency]);

  // Calculate recipient amount when send amount or rate changes
  useEffect(() => {
    const amount = parseFloat(sendAmount);
    if (!isNaN(amount) && amount > 0 && exchangeRate > 0) {
      const convertedAmount = amount * exchangeRate;
      setRecipientGets(convertedAmount.toFixed(2));
    } else {
      setRecipientGets('0.00');
    }
  }, [sendAmount, exchangeRate]);

  const handleSendMoney = async () => {
    if (!fromWallet || !selectedBeneficiary) {
      toast({
        title: 'Error',
        description: 'Please select a wallet and beneficiary',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get the account ID for the selected wallet
      const selectedAccount = wallets.find((w) => w.currency === fromWallet);
      if (!selectedAccount) {
        throw new Error('Selected wallet not found');
      }

      // Create transaction via backend
      const transaction = await transactionService.create({
        fromAccountId: selectedAccount.id,
        toBeneficiaryId: selectedBeneficiary,
        amount: parseFloat(sendAmount),
        currency: fromWallet,
        recipientCurrency: receiveCurrency,
        type: 'REMITTANCE',
        description: `Transfer to ${recipientName}`,
        metadata: {
          exchangeRate,
          recipientGets: parseFloat(recipientGets),
        },
      });

      toast({
        title: 'Transfer Successful!',
        description: `Sent ${sendAmount} ${fromWallet} to ${recipientName}`,
      });

      // Refresh wallets to show updated balance
      const updatedAccounts = await walletService.getAccounts();
      setWallets(updatedAccounts);

      // Reset form
      setSendAmount('0.00');
      setSelectedBeneficiary(undefined);
    } catch (error) {
      console.error('Transfer error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Transfer failed. Please try again.';
      toast({
        title: 'Transfer Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const recipientName =
    beneficiaries.find((b) => b.id === selectedBeneficiary)?.name || 'N/A';

  const transactionDetails = {
    sendAmount: parseFloat(sendAmount).toFixed(2),
    sendCurrency: fromWallet || '',
    recipientGets: recipientGets,
    recipientCurrency: receiveCurrency,
    recipientName: recipientName,
    exchangeRate: `1 ${fromWallet} = ${exchangeRate.toFixed(4)} ${receiveCurrency}`,
    fee: '$5.00', // TODO: Calculate dynamic fee from backend
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
    !isKycVerified ||
    isLoading ||
    !!amountError ||
    parseFloat(sendAmount) <= 0 ||
    !selectedBeneficiary;
    
  const currentRate =
    fromWallet && receiveCurrency && exchangeRate > 0
      ? `1 ${fromWallet} = ${exchangeRate.toFixed(4)} ${receiveCurrency}`
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
                disabled={!isKycVerified}
              >
                <SelectTrigger id="recipient">
                  <SelectValue placeholder={beneficiaries.length > 0 ? "Select a saved recipient" : "No saved recipients"} />
                </SelectTrigger>
                <SelectContent>
                  {beneficiaries.length > 0 ? (
                    beneficiaries.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.bank} ••••{b.accountLast4})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-recipients" disabled>
                        No saved recipients
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-wallet">From Wallet</Label>
                {loadingData ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={fromWallet} onValueChange={setFromWallet} disabled={!isKycVerified}>
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
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  onFocus={(e) => {
                    if (e.target.value === '0.00') setSendAmount('');
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') setSendAmount('0.00');
                  }}
                  placeholder="0.00"
                  disabled={!isKycVerified}
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
                  disabled={!isKycVerified}
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
                  disabled={!isKycVerified}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note / Reference (Optional)</Label>
              <Input id="note" placeholder="e.g., For school fees" disabled={!isKycVerified}/>
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
              <Button className="w-full" disabled={isLoading || !isKycVerified}>
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
                 <PaymentConfirmationDialog onConfirm={handleSendMoney} transactionDetails={{...transactionDetails, recipientName: "Payvost User"}} isLoading={isLoading}>
                    <Button className="w-full" disabled={isLoading || !isKycVerified}>Send to User</Button>
                 </PaymentConfirmationDialog>
            </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
