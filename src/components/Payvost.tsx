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
import { Landmark, AtSign, ArrowDown, TrendingUp, TrendingDown, Info, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { SendToBankForm } from './send-to-bank-form';
import { SendToUserForm } from './send-to-user-form';
import { PaymentConfirmationDialog } from './payment-confirmation-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  walletService,
  transactionService,
  currencyService,
  recipientService,
  payoutService,
  type Account,
  type UserProfile,
  type Recipient,
} from '@/services';
import { TransferPageSkeleton } from '@/components/skeletons/transfer-page-skeleton';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { isKycVerified as isKycVerifiedStatus } from '@/types/kyc';
import { BeneficiaryList } from './BeneficiaryList';

interface FeeBreakdown {
  feeAmount: string;
  breakdown: {
    fixedFees: string;
    percentageFees: string;
    discounts: string;
    total: string;
  };
}

export function Payvost() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [wallets, setWallets] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Recipient[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [sendAmount, setSendAmount] = useState('0.00');
  const [fromWallet, setFromWallet] = useState<string | undefined>(undefined);
  const [amountError, setAmountError] = useState('');
  const [receiveCurrency, setReceiveCurrency] = useState('NGN');
  const [recipientGets, setRecipientGets] = useState('0.00');
  const [userCountry, setUserCountry] = useState<string>('US');
  const [recipientCountry, setRecipientCountry] = useState<string>('NG');
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [rateTrend, setRateTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [previousRate, setPreviousRate] = useState<number | null>(null);
  const { toast } = useToast();

  const normalizeRecipientCountry = (value: unknown): string | undefined => {
    if (value === null || value === undefined) return undefined;
    const raw = String(value).trim();
    if (!raw) return undefined;
    if (/^[a-zA-Z]{2,3}$/.test(raw)) return raw.toUpperCase();
    const countryMap: Record<string, string> = {
      Nigeria: 'NG', Ghana: 'GH', Kenya: 'KE', 'South Africa': 'ZA',
      'United States': 'US', 'United Kingdom': 'GB', Canada: 'CA',
      Australia: 'AU', Germany: 'DE', France: 'FR',
    };
    return countryMap[raw];
  };

  const [paymentIdRecipient, setPaymentIdRecipient] = useState<UserProfile | null>(null);
  const [paymentIdAmount, setPaymentIdAmount] = useState('');
  const [paymentIdNote, setPaymentIdNote] = useState('');
  const [activeTab, setActiveTab] = useState('user');

  const [bankFormCountry, setBankFormCountry] = useState('');
  const [bankFormBank, setBankFormBank] = useState('');
  const [bankFormAccountNumber, setBankFormAccountNumber] = useState('');
  const [bankFormRecipientName, setBankFormRecipientName] = useState('');
  const [bankFormAmount, setBankFormAmount] = useState('');

  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
  const [loadingFees, setLoadingFees] = useState(false);
  const [isPaymentIdTransfer, setIsPaymentIdTransfer] = useState(false);

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
        try {
          const saved = await recipientService.list();
          setBeneficiaries(saved);
        } catch (error) {
          setBeneficiaries([]);
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.countryCode) {
            setUserCountry(userData.countryCode);
          }
        }

        if (accounts.length > 0 && !fromWallet) {
          setFromWallet(accounts[0].currency);
        }
        setLoadingData(false);
      } catch (error) {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user, authLoading, fromWallet]);

  useEffect(() => {
    if (authLoading || !user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setIsKycVerified(isKycVerifiedStatus(data?.kycStatus));
      }
    });
    return () => unsubscribe();
  }, [user, authLoading]);

  useEffect(() => {
    const selectedWallet = wallets.find((w) => w.currency === fromWallet);
    const amountString = activeTab === 'bank' ? bankFormAmount : paymentIdAmount;
    const amount = parseFloat(amountString || '0');
    if (selectedWallet && !isNaN(amount) && amount > selectedWallet.balance) {
      setAmountError('Insufficient balance.');
    } else {
      setAmountError('');
    }
  }, [paymentIdAmount, bankFormAmount, activeTab, fromWallet, wallets]);

  useEffect(() => {
    const fetchRate = async () => {
      if (!fromWallet || !receiveCurrency || fromWallet === receiveCurrency) {
        setExchangeRate(1);
        setPreviousRate(1);
        return;
      }
      try {
        const rate = await currencyService.getRate(fromWallet, receiveCurrency);
        const numericRate = typeof rate === 'string' ? parseFloat(rate) : Number(rate);
        const validRate = !isNaN(numericRate) && isFinite(numericRate) ? numericRate : 0;
        if (previousRate !== null) {
          if (validRate > previousRate) setRateTrend('up');
          else if (validRate < previousRate) setRateTrend('down');
          else setRateTrend('neutral');
        }
        setPreviousRate(validRate);
        setExchangeRate(validRate);
      } catch (error) {
        setExchangeRate(0);
      }
    };
    fetchRate();
  }, [fromWallet, receiveCurrency]);

  useEffect(() => {
    const amountString = activeTab === 'bank' ? bankFormAmount : paymentIdAmount;
    const amount = parseFloat(amountString || '0');
    const numericRate = typeof exchangeRate === 'string' ? parseFloat(exchangeRate) : Number(exchangeRate);
    const validRate = !isNaN(numericRate) && isFinite(numericRate) ? numericRate : 0;
    if (!isNaN(amount) && amount > 0 && validRate > 0) {
      setRecipientGets((amount * validRate).toFixed(2));
    } else {
      setRecipientGets('0.00');
    }
  }, [paymentIdAmount, bankFormAmount, activeTab, exchangeRate]);

  useEffect(() => {
    const calculateFees = async () => {
      const amountString = activeTab === 'bank' ? bankFormAmount : paymentIdAmount;
      const amount = parseFloat(amountString || '0');
      const isPaymentId = activeTab === 'user' && paymentIdRecipient !== null;
      setIsPaymentIdTransfer(isPaymentId);

      if (isPaymentId) {
        setFeeBreakdown({
          feeAmount: '0.00',
          breakdown: { fixedFees: '0.00', percentageFees: '0.00', discounts: '0.00', total: '0.00' },
        });
        return;
      }

      if (!amount || amount <= 0 || !fromWallet || !user) {
        setFeeBreakdown(null);
        return;
      }

      setLoadingFees(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/transaction/calculate-fees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            amount, currency: fromWallet, transactionType: 'REMITTANCE',
            fromCountry: userCountry || 'US', toCountry: recipientCountry || 'NG',
          }),
        });
        if (response.ok) setFeeBreakdown(await response.json());
      } catch (error) {
        setFeeBreakdown(null);
      } finally {
        setLoadingFees(false);
      }
    };
    calculateFees();
  }, [paymentIdAmount, bankFormAmount, fromWallet, activeTab, paymentIdRecipient, user]);

  const handleSelectBeneficiary = (beneficiary: Recipient) => {
    if (beneficiary.type === 'INTERNAL') {
      setActiveTab('user');
      setPaymentIdRecipient({
        uid: (beneficiary as any).payvostUserId || '',
        username: beneficiary.name,
        fullName: beneficiary.name,
        email: (beneficiary as any).email || '',
      } as UserProfile);
      setFromWallet(beneficiary.currency);
    } else {
      setActiveTab('bank');
      setBankFormCountry(beneficiary.country || '');
      setBankFormBank(beneficiary.bankName || '');
      setBankFormAccountNumber(beneficiary.accountNumber || '');
      setBankFormRecipientName(beneficiary.name);
      setFromWallet(beneficiary.currency);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({ title: 'Beneficiary Selected', description: `Form populated with ${beneficiary.name}'s details.` });
  };

  const handleSendMoney = async (options?: { saveBeneficiary?: boolean; schedulePayment?: boolean }) => {
    const selectedWallet = wallets.find((w) => w.currency === fromWallet);
    if (!selectedWallet) {
      toast({
        title: 'Error',
        description: 'Please select a wallet first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true); // Assuming setIsLoading is the correct state setter

      if (activeTab === 'user') { // Changed from 'internal' to 'user' to match activeTab state
        if (!paymentIdRecipient) throw new Error('Please select a Payment ID recipient');
        if (!paymentIdAmount || parseFloat(paymentIdAmount) <= 0) throw new Error('Please enter a valid amount');

        let recipientAccountId: string | undefined;
        const response = await fetch(`/api/user/accounts?userId=${paymentIdRecipient.uid}&currency=${fromWallet}`);
        if (response.ok) {
          const data = await response.json();
          recipientAccountId = data.accounts?.find((acc: Account) => acc.currency === fromWallet)?.id;
        }

        if (!recipientAccountId) throw new Error(`Recipient does not have a ${fromWallet} wallet.`);

        // Execute internal transfer
        await transactionService.create({
          fromAccountId: selectedWallet.id,
          toAccountId: recipientAccountId,
          amount: parseFloat(paymentIdAmount),
          currency: fromWallet,
          type: 'TRANSFER',
          description: paymentIdNote || `Transfer to ${paymentIdRecipient.fullName}`,
          metadata: options?.schedulePayment ? { scheduled: true, frequency: 'monthly' } : undefined
        });

        // Save beneficiary if requested
        if (options?.saveBeneficiary) {
          try {
            await recipientService.create({
              name: paymentIdRecipient.fullName || paymentIdRecipient.username,
              type: 'INTERNAL',
              payvostUserId: paymentIdRecipient.uid,
              email: paymentIdRecipient.email,
              currency: fromWallet
            });
          } catch (err) {
            console.error('Failed to save internal beneficiary:', err);
          }
        }
      } else { // activeTab === 'bank'
        // External Bank Transfer
        if (!bankFormBank || !bankFormAccountNumber || !bankFormAmount || parseFloat(bankFormAmount) <= 0) throw new Error('Bank details or amount missing');

        // Create recipient first (or find existing)
        let recipient: Recipient;
        recipient = await recipientService.create({
          name: bankFormRecipientName, bankName: bankFormBank,
          accountNumber: bankFormAccountNumber, currency: fromWallet,
          country: bankFormCountry, type: 'EXTERNAL',
        });

        await payoutService.create({
          fromAccountId: selectedWallet.id, recipientId: recipient.id,
          amount: parseFloat(bankFormAmount), currency: fromWallet,
          description: `Payout to ${bankFormRecipientName}`,
        });

        toast({ title: 'Payout Created', description: `Transfer to ${bankFormRecipientName} initiated.` });
        setBankFormAmount('0.00'); setWallets(await walletService.getAccounts());
        setBeneficiaries(await recipientService.list());
      }
    } catch (error: any) {
      toast({ title: 'Transfer Failed', description: error.message, variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const recipientName = activeTab === 'user' && paymentIdRecipient
    ? paymentIdRecipient.fullName || paymentIdRecipient.username : bankFormRecipientName;

  const currentAmount = activeTab === 'user' ? paymentIdAmount : bankFormAmount;
  const currentRateStr = `1 ${fromWallet} = ${exchangeRate.toFixed(4)} ${receiveCurrency}`;

  const transactionDetails = {
    sendAmount: parseFloat(currentAmount || '0').toFixed(2),
    sendCurrency: fromWallet || '',
    recipientGets: recipientGets,
    recipientCurrency: receiveCurrency,
    recipientName: recipientName || 'Recipient',
    exchangeRate: currentRateStr,
    fee: isPaymentIdTransfer ? 'Free' : `$${feeBreakdown?.feeAmount || '0.00'}`,
  };

  const getDisabledReason = () => {
    if (!isKycVerified) return 'Complete identity verification to proceed';
    if (isLoading) return 'Processing...';
    if (!!amountError) return amountError;
    if (parseFloat(currentAmount || '0') <= 0) return 'Enter a valid amount';
    if (activeTab === 'user' && !paymentIdRecipient) return 'Select a recipient';
    if (activeTab === 'bank' && !bankFormRecipientName) return 'Enter bank details';
    return null;
  };

  const disabledReason = getDisabledReason();
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  if (loadingData) return <TransferPageSkeleton />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Send Money</CardTitle>
            <CardDescription>Choose a recipient and send money in just a few clicks.</CardDescription>
          </CardHeader>

          {!isKycVerified && (
            <CardContent className="pt-0">
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <AlertDescription className="flex flex-col gap-3 text-sm text-amber-900 dark:text-amber-100">
                  <span>Payments are locked until your identity is verified.</span>
                  <div><Button asChild size="sm"><Link href="/dashboard/get-started/verify">Complete KYC</Link></Button></div>
                </AlertDescription>
              </Alert>
            </CardContent>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardContent className="pb-0">
              <TabsList className="inline-flex w-auto gap-1">
                <TabsTrigger value="user" className="relative">
                  <AtSign className="mr-2 h-4 w-4" />
                  Payment ID
                  {isPaymentIdTransfer && <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">Free</Badge>}
                </TabsTrigger>
                <TabsTrigger value="bank">
                  <Landmark className="mr-2 h-4 w-4" />
                  Send to Bank
                </TabsTrigger>
              </TabsList>
            </CardContent>

            <TabsContent value="user">
              <CardContent className="space-y-4 pt-4">
                <Alert className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
                  <Zap className="h-4 w-4 text-green-600" />
                  <AlertDescription><strong>Free instant transfers!</strong> No fees to verified Payvost users.</AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Wallet</Label>
                    <Select value={fromWallet} onValueChange={setFromWallet}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {wallets.map(w => <SelectItem key={w.currency} value={w.currency}>{w.currency} Wallet ({formatCurrency(w.balance, w.currency)})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>To Currency</Label>
                    <Select value={receiveCurrency} onValueChange={setReceiveCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">NGN</SelectItem>
                        <SelectItem value="GHS">GHS</SelectItem>
                        <SelectItem value="KES">KES</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SendToUserForm
                  onRecipientChange={setPaymentIdRecipient}
                  onAmountChange={setPaymentIdAmount}
                  onNoteChange={setPaymentIdNote}
                  defaultAmount={paymentIdAmount}
                  defaultNote={paymentIdNote}
                />
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <PaymentConfirmationDialog onConfirm={handleSendMoney} transactionDetails={transactionDetails} isLoading={isLoading} showOptions={true}>
                  <Button className="w-full" disabled={!!disabledReason}>
                    {isPaymentIdTransfer ? <><Zap className="mr-2 h-4 w-4" /> Send Free Transfer</> : 'Send to User'}
                  </Button>
                </PaymentConfirmationDialog>
                {disabledReason && <p className="text-xs text-muted-foreground text-center">{disabledReason}</p>}
              </CardFooter>
            </TabsContent>

            <TabsContent value="bank">
              <CardContent className="space-y-4 pt-4">
                <SendToBankForm
                  onCountryChange={setBankFormCountry}
                  onBankChange={setBankFormBank}
                  onAccountNumberChange={setBankFormAccountNumber}
                  onRecipientNameChange={setBankFormRecipientName}
                  onAmountChange={setBankFormAmount}
                  onSaveBeneficiaryChange={() => { }} // Legacy
                  disabled={isLoading}
                />
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <PaymentConfirmationDialog onConfirm={handleSendMoney} transactionDetails={transactionDetails} isLoading={isLoading} showOptions={true}>
                  <Button className="w-full" disabled={!!disabledReason}>Continue to Transfer</Button>
                </PaymentConfirmationDialog>
                {disabledReason && <p className="text-xs text-muted-foreground text-center">{disabledReason}</p>}
              </CardFooter>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <div className="lg:col-span-4 lg:sticky lg:top-6">
        <BeneficiaryList
          type={activeTab === 'user' ? 'INTERNAL' : 'EXTERNAL'}
          beneficiaries={beneficiaries}
          onSelect={handleSelectBeneficiary}
          isLoading={loadingData}
        />
      </div>
    </div>
  );
}
