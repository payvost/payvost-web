
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedTabs } from '@/components/enhanced-tabs';
import { ArrowRightLeft, Landmark, Upload, Calendar, Users, Gift, Smartphone, Zap, FileText, Tv, ChevronDown, CreditCard } from 'lucide-react';
import { Payvost } from '@/components/Payvost';
import { Beneficiaries } from '@/components/beneficiaries';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PaymentConfirmationDialog } from '@/components/payment-confirmation-dialog';
import { reloadlyService, type Biller, type GiftCardProduct, externalTransactionService, walletService, currencyService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { ExchangeRatePreview } from '@/components/bill-payment/exchange-rate-preview';
import { WalletSelector } from '@/components/bill-payment/wallet-selector';
import { BillPaymentHistory } from '@/components/bill-payment/bill-payment-history';
import { SavedBillTemplates } from '@/components/bill-payment/saved-bill-templates';

const billerData: Record<string, any> = {
  NGA: {
    currency: 'NGN',
    flag: 'NG',
    categories: [
      { value: 'airtime', label: 'Airtime', icon: <Smartphone className="h-5 w-5 mr-2" />, providers: ['MTN', 'Airtel', 'Glo', '9mobile'] },
      { value: 'data', label: 'Data', icon: <FileText className="h-5 w-5 mr-2" />, providers: ['MTN', 'Airtel', 'Spectranet'] },
      { value: 'electricity', label: 'Electricity', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['Ikeja Electric (IKEDC)', 'Eko Electric (EKEDC)'] },
      { value: 'cable', label: 'Cable TV', icon: <Tv className="h-5 w-5 mr-2" />, providers: ['DSTV', 'GOtv'] },
    ]
  },
  USA: {
    currency: 'USD',
    flag: 'US',
    categories: [
      { value: 'utilities', label: 'Utilities', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['Con Edison', 'PG&E', 'Florida Power & Light'] },
      { value: 'phone', label: 'Phone Bill', icon: <Smartphone className="h-5 w-5 mr-2" />, providers: ['AT&T', 'Verizon', 'T-Mobile'] },
      { value: 'cable', label: 'Cable & Internet', icon: <Tv className="h-5 w-5 mr-2" />, providers: ['Comcast Xfinity', 'Spectrum', 'Cox'] },
    ]
  },
  GBR: {
    currency: 'GBP',
    flag: 'GB',
    categories: [
      { value: 'energy', label: 'Energy', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['British Gas', 'EDF Energy', 'ScottishPower'] },
      { value: 'mobile', label: 'Mobile Top-up', icon: <Smartphone className="h-5 w-5 mr-2" />, providers: ['EE', 'O2', 'Vodafone'] },
      { value: 'council_tax', label: 'Council Tax', icon: <Landmark className="h-5 w-5 mr-2" />, providers: [] },
    ]
  },
  CAN: {
    currency: 'CAD',
    flag: 'CA',
    categories: [
      { value: 'utilities', label: 'Utilities', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['Hydro One', 'BC Hydro', 'Enmax'] },
      { value: 'phone', label: 'Phone Bill', icon: <Smartphone className="h-5 w-5 mr-2" />, providers: ['Rogers', 'Bell', 'Telus'] },
      { value: 'cable', label: 'Cable & Internet', icon: <Tv className="h-5 w-5 mr-2" />, providers: ['Shaw', 'Cogeco', 'Videotron'] },
    ]
  },
  AUS: {
    currency: 'AUD',
    flag: 'AU',
    categories: [
      { value: 'utilities', label: 'Utilities', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['AGL', 'Origin Energy', 'EnergyAustralia'] },
      { value: 'phone', label: 'Phone Bill', icon: <Smartphone className="h-5 w-5 mr-2" />, providers: ['Telstra', 'Optus', 'Vodafone'] },
      { value: 'internet', label: 'Internet', icon: <Tv className="h-5 w-5 mr-2" />, providers: ['Telstra', 'Optus', 'TPG'] },
    ]
  },
  KEN: {
    currency: 'KES',
    flag: 'KE',
    categories: [
      { value: 'airtime', label: 'Airtime', icon: <Smartphone className="h-5 w-5 mr-2" />, providers: ['Safaricom', 'Airtel', 'Telkom'] },
      { value: 'electricity', label: 'Electricity', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['Kenya Power', 'KPLC'] },
      { value: 'water', label: 'Water', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['Nairobi Water'] },
    ]
  },
  GHA: {
    currency: 'GHS',
    flag: 'GH',
    categories: [
      { value: 'airtime', label: 'Airtime', icon: <Smartphone className="h-5 w-5 mr-2" />, providers: ['MTN', 'Vodafone', 'AirtelTigo'] },
      { value: 'electricity', label: 'Electricity', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['ECG', 'NEDCo'] },
      { value: 'water', label: 'Water', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['GWCL'] },
    ]
  },
  IND: {
    currency: 'INR',
    flag: 'IN',
    categories: [
      { value: 'mobile', label: 'Mobile Recharge', icon: <Smartphone className="h-5 w-5 mr-2" />, providers: ['Airtel', 'Jio', 'Vodafone Idea'] },
      { value: 'electricity', label: 'Electricity', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['BSES', 'Tata Power', 'Adani Electricity'] },
      { value: 'gas', label: 'Gas', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['Indane', 'HP Gas', 'Bharat Gas'] },
    ]
  },
  ZAF: {
    currency: 'ZAR',
    flag: 'ZA',
    categories: [
      { value: 'airtime', label: 'Airtime', icon: <Smartphone className="h-5 w-5 mr-2" />, providers: ['Vodacom', 'MTN', 'Cell C'] },
      { value: 'electricity', label: 'Electricity', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['Eskom', 'City Power'] },
      { value: 'water', label: 'Water', icon: <Zap className="h-5 w-5 mr-2" />, providers: ['City of Johannesburg'] },
    ]
  },
};

const VALID_TABS = ['remittances', 'bill-payment', 'bulk-transfer', 'scheduled', 'split-payment', 'gift-cards'] as const;

function PaymentsPageContent() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string | undefined>();
  
  // Tab state management
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && VALID_TABS.includes(tabFromUrl as any) ? tabFromUrl : 'remittances';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`/dashboard/payments?${params.toString()}`, { scroll: false });
  };
  
  // Sync with URL on mount or when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as any) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);
  
  // Bill payment state
  const [billCountry, setBillCountry] = useState('NGA'); // Default to Nigeria, can be dynamic
  const [billCategory, setBillCategory] = useState('');
  const [billProvider, setBillProvider] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSourceWalletId, setSelectedSourceWalletId] = useState<string>('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [ratePreview, setRatePreview] = useState<any>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [billerSearch, setBillerSearch] = useState('');
  const [favoriteBillers, setFavoriteBillers] = useState<string[]>([]);
  
  // Reloadly integration state
  const [billers, setBillers] = useState<Biller[]>([]);
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [giftCardProducts, setGiftCardProducts] = useState<GiftCardProduct[]>([]);
  const [loadingBillers, setLoadingBillers] = useState(false);
  const [loadingGiftCards, setLoadingGiftCards] = useState(false);
  const giftCardsLoadedRef = useRef(false);
  
  const currentBillerData = billerData[billCountry];
  const providers = currentBillerData.categories.find((c:any) => c.value === billCategory)?.providers || [];

  // Load user accounts
  useEffect(() => {
    const loadAccounts = async () => {
      // Wait for auth to complete and ensure user is authenticated
      if (authLoading || !user) return;
      
      try {
        const userAccounts = await walletService.getAccounts();
        setAccounts(userAccounts);
        // Auto-select first account with balance, or matching currency account
        if (userAccounts.length > 0 && !selectedSourceWalletId) {
          const matchingAccount = userAccounts.find(acc => acc.currency === currentBillerData.currency);
          const accountWithBalance = userAccounts.find(acc => acc.balance > 0);
          setSelectedSourceWalletId(matchingAccount?.id || accountWithBalance?.id || userAccounts[0].id);
        }
      } catch (error) {
        console.error('Failed to load accounts:', error);
      }
    };
    loadAccounts();
  }, [currentBillerData.currency, selectedSourceWalletId, user, authLoading]);

  // Calculate rate preview when amount or currencies change
  useEffect(() => {
    const calculatePreview = async () => {
      // Wait for auth to complete and ensure user is authenticated
      if (authLoading || !user || !billAmount || !selectedSourceWalletId || !currentBillerData) return;
      
      const sourceAccount = accounts.find(acc => acc.id === selectedSourceWalletId);
      if (!sourceAccount) return;

      const amount = parseFloat(billAmount);
      if (amount <= 0) {
        setRatePreview(null);
        return;
      }

      try {
        const preview = await currencyService.getRatePreview(
          amount,
          sourceAccount.currency,
          currentBillerData.currency,
          (user as any)?.tier || 'STANDARD'
        );
        setRatePreview(preview);
      } catch (error) {
        console.error('Failed to calculate rate preview:', error);
        setRatePreview(null);
      }
    };

    const debounceTimer = setTimeout(calculatePreview, 500);
    return () => clearTimeout(debounceTimer);
  }, [billAmount, selectedSourceWalletId, accounts, currentBillerData, user, authLoading]);

  // Filter billers by search
  const filteredBillers = billers.filter(biller =>
    biller.name.toLowerCase().includes(billerSearch.toLowerCase()) ||
    (biller as any).category?.toLowerCase().includes(billerSearch.toLowerCase())
  );

  // Load billers from Reloadly when component mounts or country changes
  useEffect(() => {
    const loadBillers = async () => {
      // Wait for auth to complete and ensure user is authenticated
      if (authLoading || !user || !billCountry) return;
      
      setLoadingBillers(true);
      try {
        // Map country codes to Reloadly country codes
        const countryCodeMap: Record<string, string> = {
          'NGA': 'NG',
          'USA': 'US',
          'GBR': 'GB',
        };
        
        const reloadlyCountryCode = countryCodeMap[billCountry] || billCountry;
        const fetchedBillers = await reloadlyService.getBillersByCountry(reloadlyCountryCode);
        // Defensive check: ensure billers is an array
        const billersArray = Array.isArray(fetchedBillers) ? fetchedBillers : [];
        setBillers(billersArray);
      } catch (error) {
        console.error('Failed to load billers:', error);
        // Fall back to hardcoded data if Reloadly fails
        setBillers([]);
      } finally {
        setLoadingBillers(false);
      }
    };

    loadBillers();
  }, [billCountry, user, authLoading]);

  // Load gift cards when gift cards tab is active
  useEffect(() => {
    const loadGiftCards = async () => {
      // Wait for auth to complete and ensure user is authenticated
      if (authLoading || !user || giftCardsLoadedRef.current) return;
      
      giftCardsLoadedRef.current = true;
      setLoadingGiftCards(true);
      try {
        const products = await reloadlyService.getGiftCardProducts();
        // Defensive check: ensure products is an array
        const productsArray = Array.isArray(products) ? products : [];
        setGiftCardProducts(productsArray.slice(0, 12)); // Show first 12
      } catch (error) {
        console.error('Failed to load gift cards:', error);
        giftCardsLoadedRef.current = false; // Reset on error so we can retry
        toast({
          title: 'Failed to load gift cards',
          description: 'Please try again later',
          variant: 'destructive',
        });
      } finally {
        setLoadingGiftCards(false);
      }
    };

    // Only load once when user is authenticated
    if (!authLoading && user) {
      loadGiftCards();
    }
  }, [user, authLoading, toast]);

  const handleBillPayment = async () => {
    if (!selectedBiller || !accountNumber || !billAmount || !user || !selectedSourceWalletId) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    let transactionRecord: any = null;
    let accountId: string | null = null;
    let balanceDeducted = false;
    
    let sourceAmount = 0;
    try {
      const sourceAccount = accounts.find(acc => acc.id === selectedSourceWalletId);
      if (!sourceAccount) {
        throw new Error('Selected wallet not found');
      }

      const billCurrency = currentBillerData.currency;
      const paymentAmount = parseFloat(billAmount);
      let needsConversion = sourceAccount.currency !== billCurrency;
      sourceAmount = paymentAmount;
      let exchangeRate = 1;
      let conversionFee = 0;
      let totalSourceAmount = paymentAmount;

      // Handle currency conversion if needed
      if (needsConversion) {
        if (!ratePreview) {
          throw new Error('Exchange rate not available. Please wait a moment and try again.');
        }

        exchangeRate = ratePreview.rate;
        conversionFee = ratePreview.fee;
        totalSourceAmount = ratePreview.totalSourceAmount;
        sourceAmount = totalSourceAmount;
      }

      // Check balance
      const accountBalance = typeof sourceAccount.balance === 'number' 
        ? sourceAccount.balance 
        : parseFloat(String(sourceAccount.balance || '0')) || 0;
      
      if (accountBalance < sourceAmount) {
        throw new Error(
          `Insufficient balance. You have ${accountBalance.toFixed(2)} ${sourceAccount.currency}, ` +
          `but need ${sourceAmount.toFixed(2)} ${sourceAccount.currency} ` +
          `(${paymentAmount} ${billCurrency}${needsConversion ? ` + ${conversionFee.toFixed(2)} conversion fee` : ''})`
        );
      }

      accountId = sourceAccount.id;

      // Create custom identifier with user info for webhook tracking
      const customIdentifier = `bill-${user.uid}-${accountId}-${Date.now()}`;
      
      // Record the transaction in our database first
      const createResponse = await externalTransactionService.create({
        userId: user.uid,
        accountId: accountId,
        provider: 'RELOADLY',
        type: 'BILL_PAYMENT',
        amount: paymentAmount,
        currency: billCurrency,
        recipientDetails: {
          billerName: selectedBiller.name,
          billerId: selectedBiller.id,
          accountNumber: accountNumber,
        },
        metadata: {
          customIdentifier,
          billerType: billCategory,
          sourceCurrency: sourceAccount.currency,
          sourceAmount: sourceAmount,
          exchangeRate: exchangeRate,
          conversionFee: conversionFee,
          needsConversion: needsConversion,
          isRecurring: isRecurring,
          recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
        },
      }) as { transaction: any };

      transactionRecord = createResponse.transaction;

      // If conversion needed, convert currency first
      if (needsConversion) {
        // Convert from source currency to bill currency
        const conversion = await currencyService.convert(
          sourceAmount - conversionFee, // Amount to convert (excluding fee)
          sourceAccount.currency,
          billCurrency
        );
        
        // Deduct full amount from source wallet (includes conversion fee)
        await walletService.deductBalance({
          accountId: accountId,
          amount: sourceAmount,
          currency: sourceAccount.currency,
          description: `Bill payment to ${selectedBiller.name} (converted from ${sourceAccount.currency})`,
          referenceId: transactionRecord.id || undefined,
        });
        balanceDeducted = true;
      } else {
        // Deduct balance from wallet BEFORE calling Reloadly
        await walletService.deductBalance({
          accountId: accountId,
          amount: paymentAmount,
          currency: billCurrency,
          description: `Bill payment to ${selectedBiller.name}`,
          referenceId: transactionRecord.id || undefined,
        });
        balanceDeducted = true;
      }

      // Make the actual bill payment via Reloadly
      const result = await reloadlyService.payBill({
        billerId: selectedBiller.id,
        subscriberAccountNumber: accountNumber,
        amount: paymentAmount,
        customIdentifier,
      });

      // Update transaction with provider ID
      if (transactionRecord?.id && result.transactionId) {
        await externalTransactionService.update(transactionRecord.id, {
          providerTransactionId: result.transactionId.toString(),
          status: result.deliveryStatus === 'SUCCESSFUL' ? 'COMPLETED' : 'PROCESSING',
        });
      }

      // Save as template if this is a frequent payment
      // (This could be enhanced with logic to detect frequent payments)
      
      // Create recurring payment if enabled
      if (isRecurring) {
        try {
          await fetch('/api/bill-payments/recurring', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              billerId: selectedBiller.id,
              accountNumber: accountNumber,
              amount: paymentAmount,
              currency: billCurrency,
              sourceAccountId: accountId,
              frequency: recurrenceFrequency,
              startDate: new Date().toISOString(),
              endDate: null,
              needsConversion,
              exchangeRate,
              conversionFee,
            }),
          });
        } catch (recurringError) {
          console.error('Failed to create recurring payment:', recurringError);
          // Don't fail the main payment if recurring setup fails
        }
      }

      toast({
        title: 'Payment Successful',
        description: `Bill payment of ${billAmount} ${currentBillerData.currency} completed successfully${isRecurring ? ' and recurring payment set up' : ''}`,
      });

      // Clear form
      setBillProvider('');
      setBillAmount('');
      setAccountNumber('');
      setSelectedBiller(null);
      setIsRecurring(false);
    } catch (error) {
      console.error('Bill payment failed:', error);
      
      // If balance was deducted but Reloadly call failed, refund the user
      if (balanceDeducted && accountId) {
        try {
          const sourceAccount = accounts.find(acc => acc.id === accountId);
          if (sourceAccount) {
            await walletService.refundBalance({
              accountId: accountId,
              amount: sourceAmount,
              currency: sourceAccount.currency,
              description: `Refund for failed bill payment`,
              referenceId: transactionRecord?.id || undefined,
            });
            console.log('Balance refunded due to failed payment');
          }
        } catch (refundError) {
          console.error('Failed to refund balance:', refundError);
          // Log this for manual review
        }
      }
      
      // Update transaction status to failed if we created a record
      if (transactionRecord?.id) {
        await externalTransactionService.update(transactionRecord.id, {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectedSourceAccount = accounts.find(acc => acc.id === selectedSourceWalletId);
  const billPaymentDetails = {
    sendAmount: ratePreview?.totalSourceAmount?.toFixed(2) || billAmount || "0.00",
    sendCurrency: selectedSourceAccount?.currency || currentBillerData.currency,
    recipientGets: billAmount || "0.00",
    recipientCurrency: currentBillerData.currency,
    recipientName: selectedBiller?.name || billProvider || "Bill Payment",
    exchangeRate: ratePreview?.rate ? `1 ${selectedSourceAccount?.currency || ''} = ${ratePreview.rate.toFixed(4)} ${currentBillerData.currency}` : 'N/A',
    fee: ratePreview?.fee ? `${ratePreview.fee.toFixed(2)} ${selectedSourceAccount?.currency || ''}` : '$0.00'
  }

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-base font-semibold sm:text-lg md:text-2xl">Payments</h1>
        </div>
        <EnhancedTabs 
          value={activeTab}
          onValueChange={handleTabChange}
          tabs={[
            {
              value: 'remittances',
              label: 'Remittances',
              icon: ArrowRightLeft,
              tooltip: 'Send money internationally to friends and family'
            },
            {
              value: 'bill-payment',
              label: 'Bill Payment',
              icon: FileText,
              tooltip: 'Pay utility bills and services'
            },
            {
              value: 'bulk-transfer',
              label: 'Bulk Transfer',
              icon: Upload,
              tooltip: 'Send money to multiple recipients at once'
            },
            {
              value: 'scheduled',
              label: 'Scheduled',
              icon: Calendar,
              tooltip: 'View and manage scheduled payments'
            },
            {
              value: 'split-payment',
              label: 'Split Payment',
              icon: Users,
              tooltip: 'Split payments between multiple people'
            },
            {
              value: 'gift-cards',
              label: 'Gift Cards',
              icon: Gift,
              tooltip: 'Purchase and manage gift cards'
            }
          ]}
        >

          <TabsContent value="remittances" className="animate-in fade-in-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
                <div className="lg:col-span-2">
                    <Payvost initialBeneficiaryId={selectedBeneficiaryId} />
                </div>
                <div className="lg:col-span-1">
                    <Beneficiaries 
                      onSelectBeneficiary={(id) => {
                        setSelectedBeneficiaryId(id);
                      }}
                    />
                </div>
            </div>
          </TabsContent>

          <TabsContent value="bill-payment" className="animate-in fade-in-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SavedBillTemplates
                  onSelectTemplate={(template) => {
                    // Find biller by ID or name
                    const biller = billers.find(b => 
                      b.id.toString() === template.billerId || 
                      b.name === template.billerName
                    );
                    if (biller) {
                      setSelectedBiller(biller);
                      setBillProvider(biller.id.toString());
                    }
                    setAccountNumber(template.accountNumber);
                    setBillAmount(template.lastPaidAmount.toString());
                  }}
                />
                <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Bill Payment</CardTitle>
                        <CardDescription>Pay for airtime, data, electricity, and more.</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-center">
                                <Image src={`/flag/${currentBillerData.flag}.png`} alt={billCountry} width={20} height={20} className="rounded-full object-cover" />
                                <span>{billCountry}</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {Object.keys(billerData).map(countryCode => (
                                <DropdownMenuItem key={countryCode} onSelect={() => {setBillCountry(countryCode); setBillCategory('')}}>
                                    <Image src={`/flag/${billerData[countryCode].flag}.png`} alt={countryCode} width={20} height={20} className="rounded-full object-cover mr-2" />
                                    <span>{countryCode}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="bill-category">Select Category</Label>
                    <Select onValueChange={setBillCategory} value={billCategory}>
                        <SelectTrigger id="bill-category">
                            <SelectValue placeholder="Select a bill category" />
                        </SelectTrigger>
                        <SelectContent>
                            {currentBillerData.categories.map((cat:any) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                    <div className="flex items-center">{cat.icon}{cat.label}</div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="provider">Provider/Biller</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Search billers..."
                        value={billerSearch}
                        onChange={(e) => setBillerSearch(e.target.value)}
                        className="mb-2"
                      />
                      <Select 
                        disabled={loadingBillers || filteredBillers.length === 0} 
                        onValueChange={(value) => {
                          setBillProvider(value);
                          const biller = filteredBillers.find(b => b.id.toString() === value);
                          setSelectedBiller(biller || null);
                        }}
                        value={billProvider}
                      >
                          <SelectTrigger id="provider">
                              <SelectValue placeholder={loadingBillers ? "Loading billers..." : filteredBillers.length > 0 ? "Select a biller" : "No billers available"} />
                          </SelectTrigger>
                          <SelectContent>
                              {filteredBillers.map((biller) => (
                                <SelectItem key={biller.id} value={biller.id.toString()}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{biller.name}</span>
                                    {favoriteBillers.includes(biller.id.toString()) && (
                                      <span className="ml-2 text-yellow-500">★</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                    </div>
                </div>
                {selectedSourceWalletId && accounts.length > 0 && (
                  <WalletSelector
                    accounts={accounts}
                    selectedAccountId={selectedSourceWalletId}
                    onSelectAccount={setSelectedSourceWalletId}
                    billCurrency={currentBillerData.currency}
                    billAmount={parseFloat(billAmount) || 0}
                  />
                )}
                <div className="space-y-2">
                    <Label htmlFor="account-number">Account/Meter Number</Label>
                    <Input 
                      id="account-number" 
                      placeholder="Enter account or meter number" 
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({currentBillerData.currency})</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      placeholder="Enter amount" 
                      value={billAmount} 
                      onChange={(e) => setBillAmount(e.target.value)} 
                    />
                    {selectedBiller && (
                      <p className="text-sm text-muted-foreground">
                        Min: {selectedBiller.localMinAmount} {selectedBiller.localTransactionFeeCurrencyCode} | 
                        Max: {selectedBiller.localMaxAmount} {selectedBiller.localTransactionFeeCurrencyCode}
                      </p>
                    )}
                </div>
                {billAmount && selectedSourceWalletId && parseFloat(billAmount) > 0 && (
                  <ExchangeRatePreview
                    amount={parseFloat(billAmount)}
                    fromCurrency={selectedSourceAccount?.currency || currentBillerData.currency}
                    toCurrency={currentBillerData.currency}
                    userTier={(user as any)?.tier || 'STANDARD'}
                  />
                )}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="recurring" className="cursor-pointer">
                      Set up as recurring payment
                    </Label>
                  </div>
                  {isRecurring && (
                    <div className="pl-6 space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select value={recurrenceFrequency} onValueChange={(v: any) => setRecurrenceFrequency(v)}>
                        <SelectTrigger id="frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                 <PaymentConfirmationDialog
                  onConfirm={handleBillPayment}
                  transactionDetails={billPaymentDetails}
                  isLoading={isLoading}
                >
                  <Button disabled={isLoading} className="w-full sm:w-auto">Pay Bill</Button>
                </PaymentConfirmationDialog>
              </CardFooter>
            </Card>
              </div>
              <div className="lg:col-span-1">
                <BillPaymentHistory />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bulk-transfer" className="animate-in fade-in-50">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Transfer</CardTitle>
                <CardDescription>Send money to multiple recipients at once by uploading a file.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 sm:p-8 border-2 border-dashed border-muted-foreground/50 rounded-lg text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">Drag and drop your CSV file here or click to upload.</p>
                    <Button variant="outline" className="mt-4 w-full sm:w-auto">
                        Upload File
                    </Button>
                </div>
                 <div className="text-sm text-muted-foreground">
                    <p>Supported file format: CSV.</p>
                    <p>Columns: recipient_name, account_number, bank_code, amount</p>
                    <Button variant="link" className="p-0 h-auto">Download sample CSV</Button>
                 </div>
              </CardContent>
               <CardFooter>
                    <Button className="w-full sm:w-auto">Process Bulk Transfer</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="animate-in fade-in-50">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Transfers</CardTitle>
                <CardDescription>Set up future-dated or recurring payments.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-12">You have no scheduled transfers.</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full sm:w-auto">Schedule New Transfer</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="split-payment" className="animate-in fade-in-50">
            <Card>
              <CardHeader>
                <CardTitle>Split Payment</CardTitle>
                <CardDescription>Divide a single payment among multiple people.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-2">
                    <Label htmlFor="total-amount">Total Amount to Split</Label>
                    <Input id="total-amount" type="number" placeholder="Enter total amount" />
                </div>
                <div className="text-center py-8">
                    <p className="text-muted-foreground">Add participants to split the bill.</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full sm:w-auto">Add Participant</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="gift-cards" className="animate-in fade-in-50">
            <Card>
              <CardHeader>
                <CardTitle>Gift Cards</CardTitle>
                <CardDescription>Purchase and send gift cards from popular brands.</CardDescription>
              </CardHeader>
              <CardContent>
                 {loadingGiftCards ? (
                   <div className="text-center py-12">
                     <p className="text-muted-foreground">Loading gift cards...</p>
                   </div>
                 ) : giftCardProducts.length > 0 ? (
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {giftCardProducts.map((product) => (
                          <Card key={product.productId} className="flex flex-col items-center justify-center p-4 sm:p-5 cursor-pointer hover:border-primary transition-colors">
                              {product.logoUrls && product.logoUrls.length > 0 ? (
                                <img src={product.logoUrls[0]} alt={product.productName} className="h-14 sm:h-16 w-auto object-contain rounded-md" />
                              ) : (
                                <div className="h-14 sm:h-16 w-20 bg-muted rounded-md flex items-center justify-center">
                                  <Gift className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              <p className="mt-2 text-sm font-semibold text-center">{product.productName}</p>
                              <p className="text-xs text-muted-foreground">{product.countryCode}</p>
                          </Card>
                      ))}
                   </div>
                 ) : (
                   <div className="text-center py-12">
                     <p className="text-muted-foreground">No gift cards available at the moment.</p>
                   </div>
                 )}
              </CardContent>
            </Card>
          </TabsContent>

        </EnhancedTabs>
      </main>
    </DashboardLayout>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout language="en" setLanguage={() => {}}>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6">
          <div className="flex items-center">
            <h1 className="text-base font-semibold sm:text-lg md:text-2xl">Payments</h1>
          </div>
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </DashboardLayout>
    }>
      <PaymentsPageContent />
    </Suspense>
  );
}
