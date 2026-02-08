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
import { ArrowRightLeft, Landmark, Users, AtSign, ArrowDown, TrendingUp, TrendingDown, Info, Zap, DollarSign } from 'lucide-react';
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
  userService,
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
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string | undefined>(undefined);
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

    // Accept ISO-3166-1 alpha-2 (and some legacy alpha-3) if provided.
    if (/^[a-zA-Z]{2,3}$/.test(raw)) return raw.toUpperCase();

    const countryMap: Record<string, string> = {
      Nigeria: 'NG',
      Ghana: 'GH',
      Kenya: 'KE',
      'South Africa': 'ZA',
      'United States': 'US',
      'United Kingdom': 'GB',
      Canada: 'CA',
      Australia: 'AU',
      Germany: 'DE',
      France: 'FR',
    };
    return countryMap[raw];
  };

  // Payment ID (user) transfer state
  const [paymentIdRecipient, setPaymentIdRecipient] = useState<UserProfile | null>(null);
  const [paymentIdAmount, setPaymentIdAmount] = useState('');
  const [paymentIdNote, setPaymentIdNote] = useState('');
  const [activeTab, setActiveTab] = useState('user'); // Default to Payment ID tab

  // Bank transfer state
  const [bankFormCountry, setBankFormCountry] = useState('');
  const [bankFormBank, setBankFormBank] = useState('');
  const [bankFormAccountNumber, setBankFormAccountNumber] = useState('');
  const [bankFormRecipientName, setBankFormRecipientName] = useState('');
  const [bankFormAmount, setBankFormAmount] = useState('');
  const [bankFormSaveBeneficiary, setBankFormSaveBeneficiary] = useState(false);

  // Fee calculation state
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
  const [loadingFees, setLoadingFees] = useState(false);
  const [isPaymentIdTransfer, setIsPaymentIdTransfer] = useState(false);

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
        // Fetch saved beneficiaries from Address Book (Prisma-backed via /api/recipient)
        try {
          const saved = await recipientService.list();
          setBeneficiaries(saved);
        } catch (error) {
          console.error('Error fetching beneficiaries:', error);
          setBeneficiaries([]);
        }

        // Fetch user country from profile (Firestore)
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();

            if (userData.countryCode) {
              setUserCountry(userData.countryCode);
            } else if (userData.country) {
              const countryMap: Record<string, string> = {
                Nigeria: 'NG',
                Ghana: 'GH',
                Kenya: 'KE',
                'South Africa': 'ZA',
                'United States': 'US',
                'United Kingdom': 'GB',
                Canada: 'CA',
                Australia: 'AU',
                Germany: 'DE',
                France: 'FR',
              };
              setUserCountry(countryMap[userData.country] || 'US');
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
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

  // Subscribe to KYC status for gating payment actions
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsKycVerified(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (!snapshot.exists()) {
        setIsKycVerified(false);
        return;
      }
      const data = snapshot.data();
      setIsKycVerified(isKycVerifiedStatus(data?.kycStatus));
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  // Keep recipientCountry in sync for fee estimation when the beneficiary changes.
  useEffect(() => {
    if (!selectedBeneficiary) return;
    const beneficiary = beneficiaries.find((b) => b.id === selectedBeneficiary);
    const cc = normalizeRecipientCountry((beneficiary as any)?.countryCode ?? (beneficiary as any)?.country);
    if (cc) setRecipientCountry(cc);
  }, [selectedBeneficiary, beneficiaries]);

  useEffect(() => {
    const selectedWallet = wallets.find((w) => w.currency === fromWallet);
    const amountString =
      activeTab === 'bank' ? bankFormAmount : activeTab === 'user' ? paymentIdAmount : sendAmount;
    const amount = parseFloat(amountString || '0');

    if (selectedWallet && !isNaN(amount) && amount > selectedWallet.balance) {
      setAmountError('Insufficient balance.');
    } else {
      setAmountError('');
    }
  }, [sendAmount, paymentIdAmount, bankFormAmount, activeTab, fromWallet, wallets]);

  // Fetch exchange rate when currencies change
  useEffect(() => {
    const fetchRate = async () => {
      if (!fromWallet || !receiveCurrency || fromWallet === receiveCurrency) {
        setExchangeRate(1);
        setPreviousRate(1);
        return;
      }

      try {
        const rate = await currencyService.getRate(fromWallet, receiveCurrency);
        // Ensure rate is a number (convert from string if needed)
        const numericRate = typeof rate === 'string' ? parseFloat(rate) : Number(rate);
        const validRate = !isNaN(numericRate) && isFinite(numericRate) ? numericRate : 0;

        // Determine trend
        if (previousRate !== null) {
          if (validRate > previousRate) {
            setRateTrend('up');
          } else if (validRate < previousRate) {
            setRateTrend('down');
          } else {
            setRateTrend('neutral');
          }
        }

        setPreviousRate(validRate);
        setExchangeRate(validRate);
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Fallback to default rates
        const fallbackRates: Record<string, Record<string, number>> = {
          USD: { NGN: 1450.5, GHS: 14.5, KES: 130.25 },
          EUR: { NGN: 1600.2, GHS: 16.0, KES: 143.5 },
          GBP: { NGN: 1850.75, GHS: 18.5, KES: 165.8 },
        };
        const rate = fallbackRates[fromWallet]?.[receiveCurrency] || 0;
        setExchangeRate(rate);
        setPreviousRate(rate);
      }
    };

    fetchRate();
  }, [fromWallet, receiveCurrency]);

  // Calculate recipient amount when send amount or rate changes
  useEffect(() => {
    const amountString =
      activeTab === 'bank' ? bankFormAmount : activeTab === 'user' ? paymentIdAmount : sendAmount;
    const amount = parseFloat(amountString || '0');
    // Ensure exchangeRate is a number
    const numericRate = typeof exchangeRate === 'string' ? parseFloat(exchangeRate) : Number(exchangeRate);
    const validRate = !isNaN(numericRate) && isFinite(numericRate) ? numericRate : 0;

    if (!isNaN(amount) && amount > 0 && validRate > 0) {
      const convertedAmount = amount * validRate;
      setRecipientGets(convertedAmount.toFixed(2));
    } else {
      setRecipientGets('0.00');
    }
  }, [sendAmount, paymentIdAmount, bankFormAmount, activeTab, exchangeRate]);

  // Calculate fees when amount or transfer type changes
  useEffect(() => {
    const calculateFees = async () => {
      const amountString =
        activeTab === 'bank' ? bankFormAmount : activeTab === 'user' ? paymentIdAmount : sendAmount;
      const amount = parseFloat(amountString || '0');
      const isPaymentId = activeTab === 'user' && paymentIdRecipient !== null;

      setIsPaymentIdTransfer(isPaymentId);

      // Payment ID transfers are free
      if (isPaymentId) {
        setFeeBreakdown({
          feeAmount: '0.00',
          breakdown: {
            fixedFees: '0.00',
            percentageFees: '0.00',
            discounts: '0.00',
            total: '0.00',
          },
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
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount,
            currency: fromWallet,
            transactionType: 'REMITTANCE',
            fromCountry: userCountry || 'US', // Get from user profile
            toCountry: recipientCountry || 'NG', // Get from recipient country
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setFeeBreakdown(data);
        } else {
          // Fallback to default fee
          setFeeBreakdown({
            feeAmount: '5.00',
            breakdown: {
              fixedFees: '5.00',
              percentageFees: '0.00',
              discounts: '0.00',
              total: '5.00',
            },
          });
        }
      } catch (error) {
        console.error('Error calculating fees:', error);
        // Fallback to default fee
        setFeeBreakdown({
          feeAmount: '5.00',
          breakdown: {
            fixedFees: '5.00',
            percentageFees: '0.00',
            discounts: '0.00',
            total: '5.00',
          },
        });
      } finally {
        setLoadingFees(false);
      }
    };

    calculateFees();
  }, [sendAmount, paymentIdAmount, bankFormAmount, fromWallet, activeTab, paymentIdRecipient, user]);

  const handleSendMoney = async () => {
    // Handle Payment ID transfer
    if (activeTab === 'user' && paymentIdRecipient) {
      if (!fromWallet || !paymentIdAmount || parseFloat(paymentIdAmount) <= 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid amount',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      try {
        const selectedAccount = wallets.find((w) => w.currency === fromWallet);
        if (!selectedAccount) {
          throw new Error('Selected wallet not found');
        }

        // Get recipient's account in the same currency
        let recipientAccountId: string | undefined;

        try {
          // Try to get recipient's account via API
          const response = await fetch(`/api/user/accounts?userId=${paymentIdRecipient.uid}&currency=${fromWallet}`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const recipientAccounts = data.accounts || [];
            const recipientAccount = recipientAccounts.find((acc: Account) => acc.currency === fromWallet);
            recipientAccountId = recipientAccount?.id;
          }
        } catch (apiError) {
          console.warn('Failed to get recipient account via API, trying Firestore fallback:', apiError);
        }

        // Fallback: Check Firestore for recipient's wallet
        if (!recipientAccountId) {
          const { db } = await import('@/lib/firebase');
          const { doc, getDoc } = await import('firebase/firestore');

          const recipientDoc = await getDoc(doc(db, 'users', paymentIdRecipient.uid));
          if (recipientDoc.exists()) {
            const recipientData = recipientDoc.data();
            const recipientWallets = recipientData.wallets || [];
            const recipientWallet = recipientWallets.find((w: any) => w.currency === fromWallet);

            if (recipientWallet && recipientWallet.id) {
              recipientAccountId = recipientWallet.id;
            }
          }
        }

        if (!recipientAccountId) {
          throw new Error(`Recipient does not have a ${fromWallet} wallet. Please ask them to create one first.`);
        }

        // Perform the transfer
        const transfer = await transactionService.create({
          fromAccountId: selectedAccount.id,
          toAccountId: recipientAccountId,
          amount: parseFloat(paymentIdAmount),
          currency: fromWallet,
          type: 'TRANSFER',
          description: paymentIdNote || `Transfer to ${paymentIdRecipient.fullName || paymentIdRecipient.username}`,
          metadata: {
            recipientUid: paymentIdRecipient.uid,
            recipientUsername: paymentIdRecipient.username,
            recipientEmail: paymentIdRecipient.email,
            transferType: 'payment_id',
          },
        });

        toast({
          title: 'Transfer Successful!',
          description: `Sent ${paymentIdAmount} ${fromWallet} to ${paymentIdRecipient.fullName || paymentIdRecipient.username}`,
        });

        // Reset form
        setPaymentIdAmount('');
        setPaymentIdNote('');
        setPaymentIdRecipient(null);

        // Refresh wallets
        const updatedAccounts = await walletService.getAccounts();
        setWallets(updatedAccounts);
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
      return;
    }

    // Handle bank transfer
    if (activeTab === 'bank') {
      if (!fromWallet || !bankFormCountry || !bankFormBank || !bankFormAccountNumber || !bankFormRecipientName || !bankFormAmount || parseFloat(bankFormAmount) <= 0) {
        toast({
          title: 'Error',
          description: 'Please fill in all bank details and enter a valid amount',
          variant: 'destructive',
        });
        return;
      }

      // For now, sending to a new bank beneficiary always creates an Address Book entry
      // (beneficiaries stored in Prisma). The old Firestore-based toggle is no longer supported.
      if (!bankFormSaveBeneficiary) {
        toast({
          title: 'Save required',
          description: 'To send to a new bank beneficiary, please enable "Save as beneficiary".',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      try {
        const selectedAccount = wallets.find((w) => w.currency === fromWallet);
        if (!selectedAccount) throw new Error('Selected wallet not found');

        // 1) Create beneficiary in Address Book
        const recipient = await recipientService.create({
          name: bankFormRecipientName,
          bankName: bankFormBank,
          accountNumber: bankFormAccountNumber,
          currency: fromWallet,
          country: bankFormCountry,
          type: 'EXTERNAL',
        });

        // 2) Create payout (external remittance)
        await payoutService.create({
          fromAccountId: selectedAccount.id,
          recipientId: recipient.id,
          amount: parseFloat(bankFormAmount),
          currency: fromWallet,
          description: `Payout to ${bankFormRecipientName} (${bankFormBank})`,
        });

        toast({
          title: 'Payout Created',
          description: `Created a payout of ${bankFormAmount} ${fromWallet} to ${bankFormRecipientName}.`,
        });

        // Reset form and refresh wallets
        setBankFormAmount('0.00');
        setBankFormAccountNumber('');
        setBankFormRecipientName('');
        setBankFormBank('');
        setBankFormCountry('');
        setBankFormSaveBeneficiary(false);
        const updatedAccounts = await walletService.getAccounts();
        setWallets(updatedAccounts);
        const saved = await recipientService.list();
        setBeneficiaries(saved);
      } catch (error) {
        console.error('Transfer error:', error);
        toast({
          title: 'Transfer Failed',
          description: error instanceof Error ? error.message : 'Transfer failed. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Handle beneficiary transfer
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
      const selectedAccount = wallets.find((w) => w.currency === fromWallet);
      if (!selectedAccount) {
        throw new Error('Selected wallet not found');
      }

      // Ensure exchangeRate is a number for metadata
      const numericExchangeRate = typeof exchangeRate === 'string' ? parseFloat(exchangeRate) : Number(exchangeRate);
      const validExchangeRate = !isNaN(numericExchangeRate) && isFinite(numericExchangeRate) ? numericExchangeRate : 0;

      await payoutService.create({
        fromAccountId: selectedAccount.id,
        recipientId: selectedBeneficiary,
        amount: parseFloat(sendAmount),
        currency: fromWallet,
        description: `Payout to ${recipientName}`,
      });

      toast({
        title: 'Payout Created',
        description: `Created a payout of ${sendAmount} ${fromWallet} to ${recipientName}.`,
      });

      const updatedAccounts = await walletService.getAccounts();
      setWallets(updatedAccounts);

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
    activeTab === 'user' && paymentIdRecipient
      ? paymentIdRecipient.fullName || paymentIdRecipient.username || 'User'
      : activeTab === 'bank'
        ? bankFormRecipientName || 'New Bank Recipient'
        : beneficiaries.find((b) => b.id === selectedBeneficiary)?.name || 'N/A';

  const currentAmount = activeTab === 'user' ? paymentIdAmount : activeTab === 'bank' ? bankFormAmount : sendAmount;
  const feeAmount = feeBreakdown?.feeAmount || '0.00';
  const isFreeTransfer = isPaymentIdTransfer;

  // Helper function to safely format exchange rate
  const formatExchangeRate = (rate: number | string | undefined | null): string => {
    if (rate == null) return '0.0000';
    const numericRate = typeof rate === 'string' ? parseFloat(rate) : Number(rate);
    if (isNaN(numericRate) || !isFinite(numericRate)) {
      return '0.0000';
    }
    return numericRate.toFixed(4);
  };

  const transactionDetails = {
    sendAmount: parseFloat(currentAmount || '0').toFixed(2),
    sendCurrency: fromWallet || '',
    recipientGets: recipientGets,
    recipientCurrency: receiveCurrency,
    recipientName: recipientName,
    exchangeRate: fromWallet && receiveCurrency && exchangeRate != null && typeof exchangeRate === 'number' && !isNaN(exchangeRate) && exchangeRate > 0
      ? `1 ${fromWallet} = ${formatExchangeRate(exchangeRate)} ${receiveCurrency}`
      : 'Select currencies',
    fee: isFreeTransfer ? 'Free' : `$${feeAmount}`,
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getDisabledReason = () => {
    if (!isKycVerified) return 'Complete identity verification to proceed';
    if (isLoading) return 'Processing...';
    if (!!amountError) return amountError;
    if (parseFloat(currentAmount || '0') <= 0) return 'Enter a valid amount to send';
    if (activeTab === 'user' && !paymentIdRecipient) return 'Please select a recipient';
    if (activeTab === 'bank' && !bankFormRecipientName) return 'Please enter bank details';
    if (activeTab === 'beneficiary' && !selectedBeneficiary) return 'Please select a beneficiary';
    return null;
  };

  const disabledReason = getDisabledReason();
  const isButtonDisabled = !!disabledReason;

  const currentRate =
    fromWallet && receiveCurrency && exchangeRate != null && typeof exchangeRate === 'number' && !isNaN(exchangeRate) && exchangeRate > 0
      ? `1 ${fromWallet} = ${formatExchangeRate(exchangeRate)} ${receiveCurrency}`
      : 'Select currencies';

  const RateIcon = rateTrend === 'up' ? TrendingUp : rateTrend === 'down' ? TrendingDown : null;

  // Show loading skeleton while data is being fetched
  if (loadingData) {
    return <TransferPageSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Money</CardTitle>
        <CardDescription>
          Choose a recipient and send money in just a few clicks.
        </CardDescription>
      </CardHeader>
      {!isKycVerified && (
        <CardContent className="pt-0">
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <AlertDescription className="flex flex-col gap-3 text-sm text-amber-900 dark:text-amber-100">
              <span>
                Payments are locked until your identity is verified. Complete KYC to unlock transfers and bill payments.
              </span>
              <div>
                <Button asChild size="sm">
                  <Link href="/dashboard/get-started/verify">Complete KYC</Link>
                </Button>
              </div>
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
              {isPaymentIdTransfer && (
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                  Free
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="beneficiary">
              <Users className="mr-2 h-4 w-4" />
              To Beneficiary
            </TabsTrigger>
            <TabsTrigger value="bank">
              <Landmark className="mr-2 h-4 w-4" />
              Send to Bank
            </TabsTrigger>
          </TabsList>
        </CardContent>

        {/* Payment ID Tab - Default and Promoted */}
        <TabsContent value="user">
          <CardContent className="space-y-4 pt-4">
            {/* Payment ID Benefits Banner */}
            <Alert className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
              <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-sm">
                <strong>Send to Payment ID for free instant transfers!</strong> No fees, instant delivery, and secure transfers to verified Payvost users.
              </AlertDescription>
            </Alert>

            {/* Wallet and Currency Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-wallet-user">From Wallet</Label>
                {loadingData ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={fromWallet} onValueChange={setFromWallet} disabled={!isKycVerified}>
                    <SelectTrigger id="from-wallet-user" aria-label="Select source wallet">
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
                <Label htmlFor="recipient-currency-user">Recipient Currency</Label>
                <Select
                  value={receiveCurrency}
                  onValueChange={setReceiveCurrency}
                  disabled={!isKycVerified}
                >
                  <SelectTrigger id="recipient-currency-user">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                    <SelectItem value="GHS">Ghanaian Cedi (GHS)</SelectItem>
                    <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SendToUserForm Component */}
            <SendToUserForm
              onRecipientChange={(recipient) => {
                setPaymentIdRecipient(recipient);
                // Update recipient country when payment ID recipient is selected
                const cc = normalizeRecipientCountry((recipient as any)?.countryCode ?? recipient?.country);
                if (cc) setRecipientCountry(cc);
              }}
              onAmountChange={setPaymentIdAmount}
              onNoteChange={setPaymentIdNote}
              disabled={!isKycVerified}
              defaultAmount={paymentIdAmount}
              defaultNote={paymentIdNote}
            />

            {/* Exchange Rate and Fee Display */}
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exchange Rate:</span>
                <div className="flex items-center gap-2">
                  {RateIcon && (
                    <RateIcon className={cn(
                      "h-4 w-4",
                      rateTrend === 'up' ? "text-green-600" : "text-red-600"
                    )} />
                  )}
                  <span className="font-medium">{currentRate}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Transfer Fee:</span>
                <div className="flex items-center gap-2">
                  {isFreeTransfer ? (
                    <>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Zap className="h-3 w-3 mr-1" />
                        Free
                      </Badge>
                      <span className="text-xs text-muted-foreground line-through">$5.00</span>
                    </>
                  ) : (
                    <span className="font-medium">
                      {loadingFees ? 'Calculating...' : `$${feeAmount}`}
                    </span>
                  )}
                </div>
              </div>
              {isFreeTransfer && (
                <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300 mt-2">
                  <Info className="h-3 w-3" />
                  <span>You save $5.00 by using Payment ID</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <PaymentConfirmationDialog
              onConfirm={handleSendMoney}
              transactionDetails={transactionDetails}
              isLoading={isLoading}
            >
              <Button className="w-full" disabled={isButtonDisabled}>
                {isFreeTransfer ? (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Send Free Transfer
                  </>
                ) : (
                  'Send to User'
                )}
              </Button>
            </PaymentConfirmationDialog>
            {disabledReason && (
              <p className="text-xs text-muted-foreground text-center animate-in fade-in slide-in-from-top-1">
                {disabledReason}
              </p>
            )}
          </CardFooter>
        </TabsContent>

        {/* Beneficiary Tab */}
        <TabsContent value="beneficiary">
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Select
                value={selectedBeneficiary}
                onValueChange={(value) => {
                  setSelectedBeneficiary(value);
                  // Update recipient country based on selected beneficiary
                  const beneficiary = beneficiaries.find((b) => b.id === value);
                  const cc = normalizeRecipientCountry((beneficiary as any)?.countryCode ?? beneficiary?.country);
                  if (cc) setRecipientCountry(cc);
                }}
                disabled={!isKycVerified}
              >
                <SelectTrigger id="recipient" aria-label="Select beneficiary">
                  <SelectValue placeholder={beneficiaries.length > 0 ? "Select a saved recipient" : "No saved recipients"} />
                </SelectTrigger>
                <SelectContent>
                  {beneficiaries.length > 0 ? (
                    beneficiaries.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {(() => {
                          const bank = b.bankName || 'Bank';
                          const last4 = (b.accountNumber || '').toString().slice(-4);
                          const masked = last4 ? ` ****${last4}` : '';
                          return `${b.name} (${bank}${masked})`;
                        })()}
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
              <Input id="note" placeholder="e.g., For school fees" disabled={!isKycVerified} />
            </div>

            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exchange Rate:</span>
                <div className="flex items-center gap-2">
                  {RateIcon && (
                    <RateIcon className={cn(
                      "h-4 w-4",
                      rateTrend === 'up' ? "text-green-600" : "text-red-600"
                    )} />
                  )}
                  <span className="font-medium">{currentRate}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Transfer Fee:</span>
                <span className="font-medium">
                  {loadingFees ? 'Calculating...' : `$${feeAmount}`}
                </span>
              </div>
              {feeBreakdown && parseFloat(feeBreakdown.breakdown.fixedFees) > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Fee breakdown: ${feeBreakdown.breakdown.fixedFees} fixed
                  {parseFloat(feeBreakdown.breakdown.percentageFees) > 0 &&
                    ` + ${((parseFloat(feeBreakdown.breakdown.percentageFees) / parseFloat(sendAmount || '1')) * 100).toFixed(2)}%`}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <PaymentConfirmationDialog
              onConfirm={handleSendMoney}
              transactionDetails={transactionDetails}
              isLoading={isLoading}
            >
              <Button className="w-full" disabled={isButtonDisabled}>
                Send Money
              </Button>
            </PaymentConfirmationDialog>
            {disabledReason && (
              <p className="text-xs text-muted-foreground text-center animate-in fade-in slide-in-from-top-1">
                {disabledReason}
              </p>
            )}
          </CardFooter>
        </TabsContent>

        <TabsContent value="bank">
          <CardContent className="space-y-4 pt-4">
            <SendToBankForm
              onCountryChange={(countryCode) => {
                setBankFormCountry(countryCode);
                const bankCountryMap: Record<string, { country: string; currency: string }> = {
                  USA: { country: 'US', currency: 'USD' },
                  NGA: { country: 'NG', currency: 'NGN' },
                  GBR: { country: 'GB', currency: 'GBP' },
                  GHA: { country: 'GH', currency: 'GHS' },
                };
                const mapped = bankCountryMap[countryCode];
                if (mapped) {
                  setRecipientCountry(mapped.country);
                  setReceiveCurrency(mapped.currency);
                }
              }}
              onBankChange={setBankFormBank}
              onAccountNumberChange={setBankFormAccountNumber}
              onRecipientNameChange={setBankFormRecipientName}
              onAmountChange={setBankFormAmount}
              onSaveBeneficiaryChange={setBankFormSaveBeneficiary}
              disabled={isLoading || !isKycVerified}
            />
          </CardContent>
          <CardFooter className="flex-col gap-2">
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
            {disabledReason && activeTab === 'bank' && (
              <p className="text-xs text-muted-foreground text-center animate-in fade-in slide-in-from-top-1">
                {disabledReason}
              </p>
            )}
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
