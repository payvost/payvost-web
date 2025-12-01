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
import { walletService, transactionService, currencyService, userService, type Account, type UserProfile } from '@/services';
import { TransferPageSkeleton } from '@/components/skeletons/transfer-page-skeleton';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface FeeBreakdown {
  feeAmount: string;
  breakdown: {
    fixedFees: string;
    percentageFees: string;
    discounts: string;
    total: string;
  };
}

interface PayvostProps {
  initialBeneficiaryId?: string;
}

export function Payvost({ initialBeneficiaryId }: PayvostProps) {
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
  const [userCountry, setUserCountry] = useState<string>('US');
  const [recipientCountry, setRecipientCountry] = useState<string>('NG');
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [rateTrend, setRateTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [previousRate, setPreviousRate] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Payment ID (user) transfer state
  const [paymentIdRecipient, setPaymentIdRecipient] = useState<UserProfile | null>(null);
  const [paymentIdAmount, setPaymentIdAmount] = useState('');
  const [paymentIdNote, setPaymentIdNote] = useState('');
  const [activeTab, setActiveTab] = useState('user'); // Default to Payment ID tab
  
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
        // Fetch beneficiaries from Firestore
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setBeneficiaries(userData.beneficiaries || []);
              
              // Get user country from profile
              if (userData.countryCode) {
                setUserCountry(userData.countryCode);
              } else if (userData.country) {
                // Map country name to code if needed
                const countryMap: Record<string, string> = {
                  'Nigeria': 'NG', 'Ghana': 'GH', 'Kenya': 'KE', 'South Africa': 'ZA',
                  'United States': 'US', 'United Kingdom': 'GB', 'Canada': 'CA',
                  'Australia': 'AU', 'Germany': 'DE', 'France': 'FR'
                };
                setUserCountry(countryMap[userData.country] || 'US');
              }
            }
          } catch (error) {
            console.error('Error fetching beneficiaries:', error);
          }
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

  // Handle initial beneficiary selection from beneficiaries card
  useEffect(() => {
    if (initialBeneficiaryId && initialBeneficiaryId !== selectedBeneficiary && beneficiaries.length > 0) {
      setSelectedBeneficiary(initialBeneficiaryId);
      // Switch to beneficiary tab
      setActiveTab('beneficiary');
      // Update recipient country based on selected beneficiary
      const beneficiary = beneficiaries.find((b) => b.id === initialBeneficiaryId);
      if (beneficiary?.countryCode) {
        setRecipientCountry(beneficiary.countryCode);
      } else if (beneficiary?.country) {
        const countryMap: Record<string, string> = {
          'Nigeria': 'NG', 'Ghana': 'GH', 'Kenya': 'KE', 'South Africa': 'ZA',
          'United States': 'US', 'United Kingdom': 'GB', 'Canada': 'CA',
          'Australia': 'AU', 'Germany': 'DE', 'France': 'FR',
          'USA': 'US', 'NGA': 'NG', 'GBR': 'GB', 'GHA': 'GH'
        };
        setRecipientCountry(countryMap[beneficiary.country] || 'NG');
      }
    }
  }, [initialBeneficiaryId, beneficiaries, selectedBeneficiary]);

  useEffect(() => {
    const selectedWallet = wallets.find((w) => w.currency === fromWallet);
    const amount = parseFloat(sendAmount || paymentIdAmount || '0');

    if (selectedWallet && !isNaN(amount) && amount > selectedWallet.balance) {
      setAmountError('Insufficient balance.');
    } else {
      setAmountError('');
    }
  }, [sendAmount, paymentIdAmount, fromWallet, wallets]);

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
        
        // Determine trend
        if (previousRate !== null) {
          if (rate > previousRate) {
            setRateTrend('up');
          } else if (rate < previousRate) {
            setRateTrend('down');
          } else {
            setRateTrend('neutral');
          }
        }
        
        setPreviousRate(rate);
        setExchangeRate(rate);
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
    const amount = parseFloat(sendAmount || paymentIdAmount || '0');
    if (!isNaN(amount) && amount > 0 && exchangeRate > 0) {
      const convertedAmount = amount * exchangeRate;
      setRecipientGets(convertedAmount.toFixed(2));
    } else {
      setRecipientGets('0.00');
    }
  }, [sendAmount, paymentIdAmount, exchangeRate]);

  // Calculate fees when amount or transfer type changes
  useEffect(() => {
    const calculateFees = async () => {
      const amount = parseFloat(sendAmount || paymentIdAmount || '0');
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
  }, [sendAmount, paymentIdAmount, fromWallet, activeTab, paymentIdRecipient, user]);

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
      : beneficiaries.find((b) => b.id === selectedBeneficiary)?.name || 'N/A';

  const currentAmount = activeTab === 'user' ? paymentIdAmount : sendAmount;
  const feeAmount = feeBreakdown?.feeAmount || '0.00';
  const isFreeTransfer = isPaymentIdTransfer;

  const transactionDetails = {
    sendAmount: parseFloat(currentAmount || '0').toFixed(2),
    sendCurrency: fromWallet || '',
    recipientGets: recipientGets,
    recipientCurrency: receiveCurrency,
    recipientName: recipientName,
    exchangeRate: `1 ${fromWallet} = ${exchangeRate.toFixed(4)} ${receiveCurrency}`,
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

  const isButtonDisabled =
    !isKycVerified ||
    isLoading ||
    !!amountError ||
    parseFloat(currentAmount || '0') <= 0 ||
    (activeTab === 'user' ? !paymentIdRecipient : !selectedBeneficiary);

  const currentRate =
    fromWallet && receiveCurrency && exchangeRate > 0
      ? `1 ${fromWallet} = ${exchangeRate.toFixed(4)} ${receiveCurrency}`
      : 'Not available';

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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <CardContent className="pb-0">
          <TabsList className="grid w-full grid-cols-3">
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
                if (recipient?.countryCode) {
                  setRecipientCountry(recipient.countryCode);
                } else if (recipient?.country) {
                  const countryMap: Record<string, string> = {
                    'Nigeria': 'NG', 'Ghana': 'GH', 'Kenya': 'KE', 'South Africa': 'ZA',
                    'United States': 'US', 'United Kingdom': 'GB', 'Canada': 'CA',
                    'Australia': 'AU', 'Germany': 'DE', 'France': 'FR'
                  };
                  setRecipientCountry(countryMap[recipient.country] || 'NG');
                }
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
          <CardFooter>
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
                  if (beneficiary?.countryCode) {
                    setRecipientCountry(beneficiary.countryCode);
                  } else if (beneficiary?.country) {
                    const countryMap: Record<string, string> = {
                      'Nigeria': 'NG', 'Ghana': 'GH', 'Kenya': 'KE', 'South Africa': 'ZA',
                      'United States': 'US', 'United Kingdom': 'GB', 'Canada': 'CA',
                      'Australia': 'AU', 'Germany': 'DE', 'France': 'FR'
                    };
                    setRecipientCountry(countryMap[beneficiary.country] || 'NG');
                  }
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
      </Tabs>
    </Card>
  );
}
